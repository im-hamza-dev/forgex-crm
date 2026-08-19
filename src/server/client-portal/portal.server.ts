'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import {
  ForbiddenError,
  NotFoundError,
  SupabaseError,
  UnauthorizedError,
} from '@/server/shared/errors'
import { createNotificationForMany } from '@/server/notifications/notifications.server'
import { sendNotificationEmail } from '@/lib/notifications/email'

async function requireClientSession() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) throw new UnauthorizedError()

  const service = createServiceClient()

  const { data: account } = await service
    .from('client_accounts')
    .select('id, project_id, status, full_name, company, email, auth_user_id')
    .eq('auth_user_id', user.id)
    .maybeSingle()

  if (!account) throw new ForbiddenError('Client account not found')
  if (account.status === 'revoked') throw new ForbiddenError('Access revoked')

  return { user, account, service }
}

export interface PortalProjectData {
  id: string
  name: string
  status: string
  service_type: string | null
  start_date: string | null
  deadline: string | null
  completion_pct: number
  client_name: string | null
  client_company: string | null
  client_email: string
  stats: {
    updates: number
    files: number
    open_tickets: number
  }
  next_milestone: { title: string; date: string } | null
}

export interface PortalMilestoneData {
  id: string
  title: string
  state: 'completed' | 'active' | 'upcoming' | 'overdue'
  completed_date: string | null
  due_date: string | null
}

export interface PortalUpdateData {
  id: string
  content: string
  date: string
  time: string
}

export interface PortalFileData {
  id: string
  name: string
  size: string
  shared_date: string
  mime_type: string
  url: string
}

export interface PortalDocumentData {
  id: string
  type: string
  title: string
  sent_date: string
  viewed: boolean
  content_type: 'editor' | 'pdf'
  body: Record<string, unknown> | null
  file_url: string | null
  markdown_content: string | null
}

export interface PortalTicketData {
  id: string
  subject: string
  status: 'open' | 'in_progress' | 'resolved' | 'closed'
  priority: 'low' | 'medium' | 'high'
  raised_date: string
  last_message: string | null
  last_message_time: string | null
  has_new_reply: boolean
}

export interface PortalTicketMessage {
  id: string
  sender: 'team' | 'client'
  content: string
  time: string
  date?: string
  attachments?: {
    name: string
    url: string
    size: number
    mimeType: string
  }[]
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(dateStr: string): string {
  return new Date(dateStr).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

function getMilestoneState(m: {
  completed_at: string | null
  due_date: string | null
}): 'completed' | 'active' | 'upcoming' | 'overdue' {
  if (m.completed_at) return 'completed'
  if (!m.due_date) return 'upcoming'
  const due = new Date(m.due_date)
  const now = new Date()
  if (due < now) return 'overdue'
  const diff = (due.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  if (diff <= 30) return 'active'
  return 'upcoming'
}

function embeddedRow<T>(value: unknown): T | null {
  if (!value) return null
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null
  return value as T
}

function assertProjectAccess(accountProjectId: string, projectId: string) {
  if (accountProjectId !== projectId) throw new ForbiddenError()
}

export async function getPortalProject(
  projectId: string,
): Promise<PortalProjectData> {
  const { account, service } = await requireClientSession()
  assertProjectAccess(account.project_id, projectId)

  const today = new Date().toISOString().split('T')[0]!

  const { data: project, error } = await service
    .from('projects')
    .select(
      'id, name, status, service_type, start_date, deadline, completion_pct',
    )
    .eq('id', projectId)
    .maybeSingle()

  if (error) throw new SupabaseError(error.message)
  if (!project) throw new NotFoundError('Project not found')

  const [
    { count: updatesCount },
    { count: filesCount },
    { count: ticketsCount },
    { data: nextMilestoneData },
  ] = await Promise.all([
    service
      .from('project_updates')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('is_client_visible', true),
    service
      .from('project_files')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('is_client_visible', true),
    service
      .from('client_tickets')
      .select('id', { count: 'exact', head: true })
      .eq('project_id', projectId)
      .eq('client_account_id', account.id)
      .in('status', ['open', 'in_progress']),
    service
      .from('project_milestones')
      .select('title, due_date')
      .eq('project_id', projectId)
      .is('completed_at', null)
      .gte('due_date', today)
      .order('due_date', { ascending: true })
      .limit(1),
  ])

  const next = nextMilestoneData?.[0]
  const nextMilestone =
    next?.due_date
      ? {
          title: next.title,
          date: new Date(next.due_date).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
          }),
        }
      : null

  return {
    id: project.id,
    name: project.name,
    status: project.status,
    service_type: project.service_type,
    start_date: project.start_date
      ? new Date(project.start_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null,
    deadline: project.deadline
      ? new Date(project.deadline).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })
      : null,
    completion_pct: project.completion_pct ?? 0,
    client_name: account.full_name,
    client_company: account.company,
    client_email: account.email,
    stats: {
      updates: updatesCount ?? 0,
      files: filesCount ?? 0,
      open_tickets: ticketsCount ?? 0,
    },
    next_milestone: nextMilestone,
  }
}

export async function getPortalMilestones(
  projectId: string,
): Promise<PortalMilestoneData[]> {
  const { account, service } = await requireClientSession()
  assertProjectAccess(account.project_id, projectId)

  const { data, error } = await service
    .from('project_milestones')
    .select('id, title, completed_at, due_date')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true })

  if (error) throw new SupabaseError(error.message)

  return (data ?? []).map((m) => ({
    id: m.id,
    title: m.title,
    state: getMilestoneState(m),
    completed_date: m.completed_at
      ? new Date(m.completed_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : null,
    due_date: m.due_date
      ? new Date(m.due_date).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
        })
      : null,
  }))
}

export async function getPortalUpdates(
  projectId: string,
): Promise<PortalUpdateData[]> {
  const { account, service } = await requireClientSession()
  assertProjectAccess(account.project_id, projectId)

  const { data, error } = await service
    .from('project_updates')
    .select('id, content, created_at')
    .eq('project_id', projectId)
    .eq('is_client_visible', true)
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)

  return (data ?? []).map((u) => ({
    id: u.id,
    content: u.content,
    date: formatDate(u.created_at),
    time: formatTime(u.created_at),
  }))
}

export async function getPortalFiles(
  projectId: string,
): Promise<PortalFileData[]> {
  const { account, service } = await requireClientSession()
  assertProjectAccess(account.project_id, projectId)

  const { data, error } = await service
    .from('project_files')
    .select('id, file_name, file_size, mime_type, file_url, created_at')
    .eq('project_id', projectId)
    .eq('is_client_visible', true)
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)

  return (data ?? []).map((f) => ({
    id: f.id,
    name: f.file_name,
    size: formatFileSize(f.file_size ?? 0),
    shared_date: new Date(f.created_at).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    }),
    mime_type: f.mime_type ?? 'application/octet-stream',
    url: f.file_url,
  }))
}

type EmbeddedDocument = {
  id: string
  title: string
  document_type: string
  content_type?: string
  body?: Record<string, unknown> | null
  file_url?: string | null
}

type DocumentSendRow = {
  id: string
  sent_at: string
  viewed_at: string | null
  snapshot_body: Record<string, unknown> | null
  snapshot_file_url: string | null
  snapshot_content_type: string | null
  snapshot_title: string | null
  document: EmbeddedDocument | EmbeddedDocument[] | null
}

function extractTextFromTipTap(json: Record<string, unknown>): string {
  const lines: string[] = []

  function processNode(node: Record<string, unknown>): string {
    const type = node.type as string
    const content = node.content as Record<string, unknown>[] | undefined
    const text = node.text as string | undefined
    const marks = node.marks as
      | { type: string; attrs?: Record<string, unknown> }[]
      | undefined

    if (text) {
      let t = text
      if (marks?.some((m) => m.type === 'bold')) t = `**${t}**`
      if (marks?.some((m) => m.type === 'italic')) t = `*${t}*`
      return t
    }

    if (!content) return ''

    const children = content.map(processNode).join('')

    switch (type) {
      case 'heading': {
        const level =
          Number((node.attrs as { level?: number } | undefined)?.level) || 1
        return `${'#'.repeat(level)} ${children}\n\n`
      }
      case 'paragraph':
        return children ? `${children}\n\n` : '\n'
      case 'bulletList':
        return children
      case 'orderedList':
        return children
      case 'listItem':
        return `- ${children.trim()}\n`
      case 'blockquote':
        return `> ${children}\n\n`
      case 'horizontalRule':
        return `---\n\n`
      case 'hardBreak':
        return '\n'
      default:
        return children
    }
  }

  if (json.type === 'doc' && Array.isArray(json.content)) {
    for (const node of json.content as Record<string, unknown>[]) {
      lines.push(processNode(node))
    }
  }

  return lines.join('')
}

export async function getPortalDocuments(
  projectId: string,
): Promise<PortalDocumentData[]> {
  const { account, service } = await requireClientSession()
  assertProjectAccess(account.project_id, projectId)

  const { data, error } = await service
    .from('client_document_sends' as never)
    .select(
      `
      id,
      sent_at,
      viewed_at,
      snapshot_body,
      snapshot_file_url,
      snapshot_content_type,
      snapshot_title,
      document:client_documents!client_document_sends_document_id_fkey(
        id, title, document_type, content_type, body, file_url
      )
    `,
    )
    .eq('client_account_id', account.id)
    .order('sent_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)

  const seenDocIds = new Set<string>()

  return ((data ?? []) as DocumentSendRow[])
    .filter((s) => {
      const doc = embeddedRow<EmbeddedDocument>(s.document)
      if (!doc) return false
      if (seenDocIds.has(doc.id)) return false
      seenDocIds.add(doc.id)
      return true
    })
    .map((s) => {
      const doc = embeddedRow<EmbeddedDocument>(s.document)
      if (!doc) return null

      const body = s.snapshot_body ?? doc.body ?? null
      const contentType = (s.snapshot_content_type ??
        doc.content_type ??
        'editor') as 'editor' | 'pdf'
      const title = s.snapshot_title ?? doc.title
      const fileUrl = s.snapshot_file_url ?? doc.file_url ?? null

      let markdownContent: string | null = null
      if (body && contentType === 'editor') {
        if (body.type === 'markdown' && typeof body.body === 'string') {
          markdownContent = body.body
        } else if (body.type === 'doc' || Array.isArray(body.content)) {
          markdownContent = extractTextFromTipTap(body)
        }
      }

      return {
        id: s.id,
        type: doc.document_type,
        title,
        sent_date: formatDate(s.sent_at),
        viewed: Boolean(s.viewed_at),
        content_type: contentType,
        body,
        file_url: fileUrl,
        markdown_content: markdownContent,
      }
    })
    .filter((d): d is PortalDocumentData => d !== null)
}

export async function getPortalTickets(
  projectId: string,
): Promise<PortalTicketData[]> {
  const { account, service } = await requireClientSession()
  assertProjectAccess(account.project_id, projectId)

  const { data, error } = await service
    .from('client_tickets')
    .select(
      `
      id, subject, status, priority, created_at,
      client_ticket_messages(id, content, created_at, sender_type)
    `,
    )
    .eq('project_id', projectId)
    .eq('client_account_id', account.id)
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)

  return (data ?? []).map((t) => {
    const messages = (t.client_ticket_messages ?? []) as {
      id: string
      content: string
      created_at: string
      sender_type: string
    }[]
    const lastMsg = [...messages].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    )[0]
    const hasNewReply = Boolean(lastMsg && lastMsg.sender_type === 'team')

    return {
      id: t.id,
      subject: t.subject,
      status: t.status as PortalTicketData['status'],
      priority: t.priority as PortalTicketData['priority'],
      raised_date: formatDate(t.created_at),
      last_message: lastMsg?.content ?? null,
      last_message_time: lastMsg ? timeAgo(lastMsg.created_at) : null,
      has_new_reply: hasNewReply,
    }
  })
}

export async function getPortalTicketMessages(
  ticketId: string,
): Promise<PortalTicketMessage[]> {
  const { account, service } = await requireClientSession()

  const { data: ticket } = await service
    .from('client_tickets')
    .select('id')
    .eq('id', ticketId)
    .eq('client_account_id', account.id)
    .maybeSingle()

  if (!ticket) throw new NotFoundError('Ticket not found')

  const { data, error } = await service
    .from('client_ticket_messages' as never)
    .select('id, content, created_at, sender_type, attachments')
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })

  if (error) throw new SupabaseError(error.message)

  type MessageRow = {
    id: string
    content: string
    created_at: string
    sender_type: string
    attachments?: {
      name: string
      url: string
      size: number
      mimeType: string
    }[] | null
  }

  let lastDate = ''
  return ((data ?? []) as MessageRow[]).map((m) => {
    const msgDate = new Date(m.created_at).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
    const showDate = msgDate !== lastDate
    lastDate = msgDate
    return {
      id: m.id,
      sender: m.sender_type === 'team' ? 'team' : 'client',
      content: m.content,
      time: `${formatDate(m.created_at)} · ${formatTime(m.created_at)}`,
      date: showDate ? msgDate : undefined,
      attachments: m.attachments ?? [],
    }
  })
}

export async function createPortalTicket(
  projectId: string,
  input: {
    subject: string
    priority: string
    description: string
    attachments?: {
      name: string
      url: string
      size: number
      mimeType: string
    }[]
  },
): Promise<{ id: string }> {
  const { account, service } = await requireClientSession()
  assertProjectAccess(account.project_id, projectId)

  const { data, error } = await service
    .from('client_tickets')
    .insert({
      project_id: projectId,
      client_account_id: account.id,
      subject: input.subject,
      priority: input.priority as 'low' | 'medium' | 'high',
      status: 'open',
    })
    .select('id')
    .single()

  if (error) throw new SupabaseError(error.message)

  const { error: messageError } = await service
    .from('client_ticket_messages' as never)
    .insert({
      ticket_id: data.id,
      content: input.description,
      sender_type: 'client',
      client_sender_id: account.id,
      attachments: input.attachments ?? [],
    } as never)

  if (messageError) throw new SupabaseError(messageError.message)

  const { data: teamMembers } = await service
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'manager'])
    .eq('is_active', true)

  const teamIds = (teamMembers ?? []).map((m) => m.id)
  if (teamIds.length > 0) {
    void createNotificationForMany(teamIds, {
      type: 'ticket_opened',
      title: 'New client support request',
      body: `${account.full_name ?? 'Client'} raised: "${input.subject}"`,
      reference_type: 'ticket',
      reference_id: data.id,
      metadata: { ticket_subject: input.subject },
    })
  }

  const { data: admins } = await service
    .from('profiles')
    .select('id, email, full_name, updated_at')
    .eq('role', 'admin')
    .eq('is_active', true)

  for (const admin of admins ?? []) {
    void sendNotificationEmail({
      user_id: admin.id,
      type: 'ticket_opened',
      title: `New support request: ${input.subject}`,
      body: input.description,
      reference_type: 'ticket',
      reference_id: data.id,
      actor_name: account.full_name ?? undefined,
      metadata: { ticket_subject: input.subject },
    })
  }

  return { id: data.id }
}

export async function replyToPortalTicket(
  ticketId: string,
  content: string,
  attachments?: {
    name: string
    url: string
    size: number
    mimeType: string
  }[],
): Promise<void> {
  const { account, service } = await requireClientSession()

  const { data: ticket } = await service
    .from('client_tickets')
    .select('id, project_id, subject')
    .eq('id', ticketId)
    .eq('client_account_id', account.id)
    .maybeSingle()

  if (!ticket) throw new NotFoundError('Ticket not found')

  const { error } = await service
    .from('client_ticket_messages' as never)
    .insert({
      ticket_id: ticketId,
      content,
      sender_type: 'client',
      client_sender_id: account.id,
      attachments: attachments ?? [],
    } as never)

  if (error) throw new SupabaseError(error.message)

  const { data: teamMembers } = await service
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'manager'])
    .eq('is_active', true)

  const teamIds = (teamMembers ?? []).map((m) => m.id)
  if (teamIds.length > 0) {
    void createNotificationForMany(teamIds, {
      type: 'ticket_reply',
      title: 'Client replied to support request',
      body: `${account.full_name ?? 'Client'} replied to "${ticket.subject}"`,
      reference_type: 'ticket',
      reference_id: ticketId,
      metadata: { ticket_subject: ticket.subject },
    })
  }

  const { data: admins } = await service
    .from('profiles')
    .select('id, email, full_name, updated_at')
    .eq('role', 'admin')
    .eq('is_active', true)

  for (const admin of admins ?? []) {
    void sendNotificationEmail({
      user_id: admin.id,
      type: 'ticket_reply',
      title: `Client replied: ${ticket.subject ?? 'Support request'}`,
      body: content,
      reference_type: 'ticket',
      reference_id: ticketId,
      actor_name: account.full_name ?? undefined,
      metadata: { ticket_subject: ticket.subject ?? '' },
    })
  }
}

export async function markDocumentViewed(sendId: string): Promise<void> {
  const { account, service } = await requireClientSession()

  const { error } = await service
    .from('client_document_sends' as never)
    .update({ viewed_at: new Date().toISOString() } as never)
    .eq('id', sendId)
    .eq('client_account_id', account.id)
    .is('viewed_at', null)

  if (error) throw new SupabaseError(error.message)
}

export async function updatePortalProfile(input: {
  full_name: string
}): Promise<void> {
  const { account, service } = await requireClientSession()

  const { error } = await service
    .from('client_accounts')
    .update({ full_name: input.full_name })
    .eq('id', account.id)

  if (error) throw new SupabaseError(error.message)
}

export async function reopenPortalTicket(ticketId: string): Promise<void> {
  const { account, service } = await requireClientSession()

  const { data: ticket } = await service
    .from('client_tickets')
    .select('id, client_account_id')
    .eq('id', ticketId)
    .eq('client_account_id', account.id)
    .maybeSingle()

  if (!ticket) throw new NotFoundError('Ticket not found')

  const { error } = await service
    .from('client_tickets')
    .update({
      status: 'open',
      resolved_at: null,
      resolved_by: null,
    })
    .eq('id', ticketId)
    .eq('client_account_id', account.id)

  if (error) throw new SupabaseError(error.message)
}
