'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireRole, requireSession } from '@/server/shared/require-session'
import {
  ForbiddenError,
  NotFoundError,
  SupabaseError,
} from '@/server/shared/errors'
import type { Json } from '@/types/database.types'
import type {
  ClientDocument,
  ClientDocumentSend,
  ContentType,
  DocCategory,
  DocStatus,
  DocumentType,
  InternalDoc,
} from '@/types/docs'

type ProfileSnippet = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

function asJson(value: Record<string, unknown> | null | undefined): Json | null {
  if (value === undefined || value === null) return null
  return value as unknown as Json
}

function asRecord(value: Json | null): Record<string, unknown> | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  return value as Record<string, unknown>
}

async function fetchProfiles(ids: string[]) {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return {} as Record<string, ProfileSnippet>
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', unique)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]))
}

type InternalDocRow = {
  id: string
  title: string
  content: Json | null
  category: string | null
  is_shared: boolean
  author_id: string
  status?: string | null
  tags?: string[] | null
  excerpt?: string | null
  last_edited_by?: string | null
  created_at: string
  updated_at: string
}

function mapInternalDoc(
  row: InternalDocRow,
  profiles: Record<string, ProfileSnippet>,
): InternalDoc {
  const category = (row.category ?? 'Other') as DocCategory
  const status = (row.status === 'published' ? 'published' : 'draft') as DocStatus
  return {
    id: row.id,
    title: row.title,
    content: asRecord(row.content),
    category,
    is_shared: row.is_shared,
    author_id: row.author_id,
    status,
    tags: row.tags ?? [],
    excerpt: row.excerpt ?? null,
    last_edited_by: row.last_edited_by ?? null,
    created_at: row.created_at,
    updated_at: row.updated_at,
    author: profiles[row.author_id] ?? null,
    last_editor: row.last_edited_by
      ? (profiles[row.last_edited_by] ?? null)
      : null,
  }
}

export async function getInternalDocs(filters?: {
  category?: string
  search?: string
  my_only?: boolean
}) {
  const session = await requireSession()
  const supabase = await createClient()

  let query = supabase
    .from('internal_docs')
    .select('*')
    .order('updated_at', { ascending: false })

  if (filters?.category && filters.category !== 'all') {
    query = query.eq('category', filters.category)
  }
  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }
  if (filters?.my_only) {
    query = query.eq('author_id', session.user.id)
  }

  const { data, error } = await query
  if (error) throw new SupabaseError(error.message)

  const rows = (data ?? []) as unknown as InternalDocRow[]
  const profiles = await fetchProfiles([
    ...rows.map((d) => d.author_id),
    ...rows.map((d) => d.last_edited_by ?? ''),
  ])

  return rows.map((d) => mapInternalDoc(d, profiles))
}

export async function getInternalDoc(id: string) {
  await requireSession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('internal_docs')
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw new NotFoundError('Doc not found')

  const row = data as unknown as InternalDocRow
  const profiles = await fetchProfiles([
    row.author_id,
    row.last_edited_by ?? '',
  ])
  return mapInternalDoc(row, profiles)
}

export async function createInternalDoc(input: {
  title: string
  content?: Record<string, unknown> | null
  category?: DocCategory
  status?: DocStatus
  tags?: string[]
  excerpt?: string
  is_shared?: boolean
}) {
  const session = await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const payload = {
    title: input.title,
    content: asJson(input.content ?? null),
    category: input.category ?? 'Other',
    status: input.status ?? 'draft',
    tags: input.tags ?? [],
    excerpt: input.excerpt ?? null,
    is_shared: input.is_shared ?? false,
    author_id: session.user.id,
    last_edited_by: session.user.id,
  }

  const { data, error } = await supabase
    .from('internal_docs')
    .insert(payload as never)
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return data as unknown as InternalDocRow
}

export async function updateInternalDoc(
  id: string,
  input: Partial<{
    title: string
    content: Record<string, unknown> | null
    category: DocCategory
    status: DocStatus
    tags: string[]
    excerpt: string
    is_shared: boolean
  }>,
) {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('internal_docs')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!existing) throw new NotFoundError('Doc not found')

  if (session.role !== 'admin' && existing.author_id !== session.user.id) {
    throw new ForbiddenError('Cannot edit this document')
  }

  const updatePayload: Record<string, unknown> = {
    last_edited_by: session.user.id,
    updated_at: new Date().toISOString(),
  }
  if (input.title !== undefined) updatePayload.title = input.title
  if (input.content !== undefined) updatePayload.content = asJson(input.content)
  if (input.category !== undefined) updatePayload.category = input.category
  if (input.status !== undefined) updatePayload.status = input.status
  if (input.tags !== undefined) updatePayload.tags = input.tags
  if (input.excerpt !== undefined) updatePayload.excerpt = input.excerpt
  if (input.is_shared !== undefined) updatePayload.is_shared = input.is_shared

  const { data, error } = await supabase
    .from('internal_docs')
    .update(updatePayload as never)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return data as unknown as InternalDocRow
}

export async function deleteInternalDoc(id: string) {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('internal_docs')
    .select('author_id')
    .eq('id', id)
    .single()

  if (!existing) throw new NotFoundError('Doc not found')

  if (session.role !== 'admin' && existing.author_id !== session.user.id) {
    throw new ForbiddenError('Cannot delete this document')
  }

  const { error } = await supabase.from('internal_docs').delete().eq('id', id)
  if (error) throw new SupabaseError(error.message)
}

type ClientDocRow = {
  id: string
  title: string
  document_type: string
  content_type: string
  body: Json | null
  file_url: string | null
  file_name: string | null
  file_size: number | null
  mime_type: string | null
  excerpt: string | null
  tags: string[] | null
  created_by: string
  created_at: string
  updated_at: string
}

function mapClientDoc(
  row: ClientDocRow,
  profiles: Record<string, ProfileSnippet>,
  sends?: ClientDocumentSend[],
): ClientDocument {
  return {
    id: row.id,
    title: row.title,
    document_type: row.document_type as DocumentType,
    content_type: (row.content_type === 'pdf' ? 'pdf' : 'editor') as ContentType,
    body: asRecord(row.body),
    file_url: row.file_url,
    file_name: row.file_name,
    file_size: row.file_size,
    mime_type: row.mime_type,
    excerpt: row.excerpt,
    tags: row.tags ?? [],
    created_by: row.created_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    creator: profiles[row.created_by] ?? null,
    sends,
  }
}

export async function getClientDocuments() {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_documents' as never)
    .select('*')
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)

  const rows = (data ?? []) as unknown as ClientDocRow[]
  const profiles = await fetchProfiles(rows.map((d) => d.created_by))
  return rows.map((d) => mapClientDoc(d, profiles))
}

export async function getClientDocument(id: string) {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('client_documents' as never)
    .select('*')
    .eq('id', id)
    .single()

  if (error || !data) throw new NotFoundError('Document not found')

  const row = data as unknown as ClientDocRow
  const service = createServiceClient()
  const { data: sends } = await service
    .from('client_document_sends' as never)
    .select(
      `
      *,
      client_account:client_accounts(full_name, company, email)
    `,
    )
    .eq('document_id', id)

  const profiles = await fetchProfiles([row.created_by])
  return mapClientDoc(
    row,
    profiles,
    (sends ?? []) as unknown as ClientDocumentSend[],
  )
}

export async function createClientDocument(input: {
  title: string
  document_type: DocumentType
  content_type: ContentType
  body?: Record<string, unknown> | null
  file_url?: string | null
  file_name?: string | null
  file_size?: number | null
  mime_type?: string | null
  excerpt?: string
  tags?: string[]
}) {
  const session = await requireRole(['admin'])
  const supabase = await createClient()

  const payload = {
    title: input.title,
    document_type: input.document_type,
    content_type: input.content_type,
    body: asJson(input.body ?? null),
    file_url: input.file_url ?? null,
    file_name: input.file_name ?? null,
    file_size: input.file_size ?? null,
    mime_type: input.mime_type ?? null,
    excerpt: input.excerpt ?? null,
    tags: input.tags ?? [],
    created_by: session.user.id,
  }

  const { data, error } = await supabase
    .from('client_documents' as never)
    .insert(payload as never)
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return data as unknown as ClientDocRow
}

export async function updateClientDocument(
  id: string,
  input: Partial<{
    title: string
    document_type: DocumentType
    body: Record<string, unknown> | null
    file_url: string | null
    file_name: string | null
    excerpt: string
    tags: string[]
  }>,
) {
  await requireRole(['admin'])
  const supabase = await createClient()

  const updatePayload: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }
  if (input.title !== undefined) updatePayload.title = input.title
  if (input.document_type !== undefined) {
    updatePayload.document_type = input.document_type
  }
  if (input.body !== undefined) updatePayload.body = asJson(input.body)
  if (input.file_url !== undefined) updatePayload.file_url = input.file_url
  if (input.file_name !== undefined) updatePayload.file_name = input.file_name
  if (input.excerpt !== undefined) updatePayload.excerpt = input.excerpt
  if (input.tags !== undefined) updatePayload.tags = input.tags

  const { data, error } = await supabase
    .from('client_documents' as never)
    .update(updatePayload as never)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return data as unknown as ClientDocRow
}

export async function deleteClientDocument(id: string) {
  await requireRole(['admin'])
  const supabase = await createClient()
  const { error } = await supabase
    .from('client_documents' as never)
    .delete()
    .eq('id', id)
  if (error) throw new SupabaseError(error.message)
}

export async function sendDocumentToClient(
  documentId: string,
  clientAccountIds: string[],
) {
  const session = await requireRole(['admin'])
  const supabase = await createClient()

  const inserts = clientAccountIds.map((clientId) => ({
    document_id: documentId,
    client_account_id: clientId,
    sent_by: session.user.id,
  }))

  const { data, error } = await supabase
    .from('client_document_sends' as never)
    .upsert(inserts as never, { onConflict: 'document_id,client_account_id' })
    .select()

  if (error) throw new SupabaseError(error.message)
  return data
}

export async function getClientAccounts() {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_accounts')
    .select('id, full_name, company, email, status')
    .eq('status', 'active')
    .order('full_name')
  if (error) throw new SupabaseError(error.message)
  return data ?? []
}
