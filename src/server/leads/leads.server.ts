import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireSession, requireRole } from '@/server/shared/require-session'
import {
  ForbiddenError,
  NotFoundError,
  SupabaseError,
  ValidationError,
} from '@/server/shared/errors'
import type {
  Lead,
  LeadActivity,
  LeadActivityAction,
  LeadAttachment,
  LeadFilters,
  LeadInsert,
  LeadNote,
  LeadNoteType,
  LeadPriority,
  LeadSource,
  LeadStage,
  LeadStatus,
  LeadUpdate,
} from '@/types/leads'
import type { ServerSupabase } from '@/server/shared/require-session'

const LEAD_SELECT = `
  id, contact_name, company, email, phone, linkedin_url,
  source, service_interest, budget_range, tags, stage, status,
  priority, lead_score, assigned_to, created_by,
  last_contacted_at, next_follow_up, converted_project_id,
  created_at, updated_at
`

const NOTE_SELECT = `
  id, lead_id, author_id, content, note_type, created_at, updated_at,
  author:profiles!lead_notes_author_id_fkey(full_name, avatar_url)
`

const ATTACHMENT_SELECT = `
  id, lead_id, note_id, uploaded_by, file_url, file_name,
  file_size, mime_type, created_at,
  uploader:profiles!lead_attachments_uploaded_by_fkey(full_name, avatar_url)
`

function mapLead(row: Lead): Lead {
  return {
    ...row,
    assignee_name: row.assigned_profile?.full_name ?? null,
    assignee_avatar: row.assigned_profile?.avatar_url ?? null,
  }
}

async function enrichLeadsWithProfiles(leads: Lead[]): Promise<Lead[]> {
  const profileIds = [
    ...new Set(
      leads
        .flatMap((l) => [l.assigned_to, l.created_by])
        .filter((id): id is string => Boolean(id)),
    ),
  ]

  let profileMap: Record<
    string,
    { full_name: string | null; avatar_url: string | null }
  > = {}

  if (profileIds.length > 0) {
    const serviceClient = createServiceClient()
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', profileIds)

    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map((p) => [
          p.id,
          { full_name: p.full_name, avatar_url: p.avatar_url },
        ]),
      )
    }
  }

  return leads.map((lead) =>
    mapLead({
      ...lead,
      assigned_profile: lead.assigned_to
        ? (profileMap[lead.assigned_to] ?? null)
        : null,
      created_profile: lead.created_by
        ? (profileMap[lead.created_by] ?? null)
        : null,
    }),
  )
}

async function enrichLeadWithProfiles(lead: Lead): Promise<Lead> {
  const [enriched] = await enrichLeadsWithProfiles([lead])
  return enriched!
}

async function logActivity(
  supabase: ServerSupabase,
  leadId: string,
  actorId: string,
  actorName: string,
  action: LeadActivityAction,
  metadata: Record<string, unknown> = {},
) {
  const { error } = await supabase.from('lead_activity' as never).insert({
    lead_id: leadId,
    actor_id: actorId,
    actor_name: actorName,
    action,
    metadata,
  } as never)

  if (error) {
    console.error('[lead_activity]', error.message)
  }
}

function actorNameFromSession(session: {
  profile: { full_name?: string | null } | null
  user: { email?: string }
}): string {
  return session.profile?.full_name ?? session.user.email ?? 'Unknown'
}

export async function getLeads(filters: LeadFilters = {}): Promise<Lead[]> {
  const session = await requireSession()
  const supabase = await createClient()

  let query = supabase
    .from('leads')
    .select(LEAD_SELECT)
    .order('updated_at', { ascending: false })

  if (session.role === 'member') {
    query = query.or(
      `assigned_to.eq.${session.user.id},created_by.eq.${session.user.id}`,
    )
  }

  if (filters.stage) query = query.eq('stage', filters.stage as LeadStage)
  if (filters.priority)
    query = query.eq('priority', filters.priority as LeadPriority)
  if (filters.status) query = query.eq('status', filters.status as LeadStatus)
  if (filters.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
  if (filters.search) {
    const q = filters.search.trim()
    if (q) {
      query = query.or(
        `contact_name.ilike.%${q}%,company.ilike.%${q}%,email.ilike.%${q}%`,
      )
    }
  }

  const { data, error } = await query
  if (error) throw new SupabaseError(error.message)
  return enrichLeadsWithProfiles((data ?? []) as Lead[])
}

export async function getLead(id: string): Promise<Lead> {
  await requireSession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('leads')
    .select(LEAD_SELECT)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new SupabaseError(error.message)
  if (!data) throw new NotFoundError('Lead not found')
  return enrichLeadWithProfiles(data as Lead)
}

export async function createLead(input: {
  contact_name: string
  company?: string | null
  email?: string | null
  phone?: string | null
  linkedin_url?: string | null
  source?: LeadSource
  service_interest?: LeadInsert['service_interest']
  budget_range?: string | null
  tags?: string[]
  stage?: LeadStage
  status?: LeadStatus
  priority?: LeadPriority
  lead_score?: number | null
  assigned_to?: string | null
  last_contacted_at?: string | null
  next_follow_up?: string | null
}): Promise<Lead> {
  const session = await requireSession()
  const supabase = await createClient()

  const assignedTo =
    session.role === 'member' ? session.user.id : (input.assigned_to ?? null)

  const insert: LeadInsert = {
    contact_name: input.contact_name,
    company: input.company || null,
    email: input.email || null,
    phone: input.phone || null,
    linkedin_url: input.linkedin_url || null,
    source: input.source ?? 'other',
    service_interest: input.service_interest ?? null,
    budget_range: input.budget_range || null,
    tags: input.tags ?? [],
    stage: input.stage ?? 'new_lead',
    status: input.status ?? 'active',
    priority: input.priority ?? 'warm',
    lead_score: input.lead_score ?? null,
    assigned_to: assignedTo,
    created_by: session.user.id,
    last_contacted_at: input.last_contacted_at || null,
    next_follow_up: input.next_follow_up || null,
  }

  const { data, error } = await supabase
    .from('leads')
    .insert(insert)
    .select(LEAD_SELECT)
    .single()

  if (error) throw new SupabaseError(error.message)

  const lead = await enrichLeadWithProfiles(data as Lead)
  await logActivity(
    supabase,
    lead.id,
    session.user.id,
    actorNameFromSession(session),
    'lead_created',
    { contact_name: lead.contact_name },
  )

  return lead
}

export async function updateLead(
  id: string,
  data: Partial<LeadUpdate>,
): Promise<Lead> {
  const session = await requireSession()
  const supabase = await createClient()

  const existing = await getLead(id)

  if (session.role === 'member') {
    const owns =
      existing.assigned_to === session.user.id ||
      existing.created_by === session.user.id
    if (!owns) throw new ForbiddenError('Cannot edit this lead')
  }

  const { data: updated, error } = await supabase
    .from('leads')
    .update(data)
    .eq('id', id)
    .select(LEAD_SELECT)
    .single()

  if (error) throw new SupabaseError(error.message)

  const lead = await enrichLeadWithProfiles(updated as Lead)
  await logActivity(
    supabase,
    id,
    session.user.id,
    actorNameFromSession(session),
    'lead_updated',
    { fields: Object.keys(data) },
  )

  return lead
}

export async function updateLeadStage(
  id: string,
  newStage: LeadStage,
  oldStage: LeadStage,
): Promise<Lead> {
  const session = await requireSession()
  const existing = await getLead(id)

  if (session.role === 'member') {
    const owns =
      existing.assigned_to === session.user.id ||
      existing.created_by === session.user.id
    if (!owns) throw new ForbiddenError('Cannot move this lead')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('leads')
    .update({ stage: newStage })
    .eq('id', id)
    .select(LEAD_SELECT)
    .single()

  if (error) throw new SupabaseError(error.message)

  const lead = await enrichLeadWithProfiles(data as Lead)
  await logActivity(
    supabase,
    id,
    session.user.id,
    actorNameFromSession(session),
    'stage_changed',
    { from: oldStage, to: newStage },
  )

  return lead
}

export async function deleteLead(id: string): Promise<void> {
  const session = await requireSession()
  const existing = await getLead(id)

  if (session.role === 'admin') {
    // ok
  } else if (
    session.role === 'manager' &&
    existing.created_by === session.user.id
  ) {
    // ok
  } else {
    throw new ForbiddenError('Only admins can delete any lead')
  }

  const supabase = await createClient()

  await logActivity(
    supabase,
    id,
    session.user.id,
    actorNameFromSession(session),
    'lead_deleted',
    { contact_name: existing.contact_name },
  )

  const { error } = await supabase.from('leads').delete().eq('id', id)
  if (error) throw new SupabaseError(error.message)
}

export async function assignLead(
  id: string,
  assignedTo: string,
  assigneeName: string,
): Promise<Lead> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const session = await requireSession()

  const { data, error } = await supabase
    .from('leads')
    .update({ assigned_to: assignedTo })
    .eq('id', id)
    .select(LEAD_SELECT)
    .single()

  if (error) throw new SupabaseError(error.message)
  if (!data) throw new NotFoundError('Lead not found')

  const lead = await enrichLeadWithProfiles(data as Lead)
  await logActivity(
    supabase,
    id,
    session.user.id,
    actorNameFromSession(session),
    'lead_assigned',
    { assigned_to: assignedTo, assignee_name: assigneeName },
  )

  return lead
}

export async function getLeadNotes(leadId: string): Promise<LeadNote[]> {
  await requireSession()
  await getLead(leadId)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lead_notes')
    .select(NOTE_SELECT)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: true })

  if (error) throw new SupabaseError(error.message)
  return (data ?? []) as LeadNote[]
}

export async function createLeadNote(
  leadId: string,
  content: string,
  noteType: LeadNoteType = 'note',
): Promise<LeadNote> {
  const session = await requireSession()
  const lead = await getLead(leadId)

  if (session.role === 'member') {
    const owns =
      lead.assigned_to === session.user.id || lead.created_by === session.user.id
    if (!owns) throw new ForbiddenError('Cannot add notes to this lead')
  }

  if (!content.trim()) throw new ValidationError('Note content is required')

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('lead_notes')
    .insert({
      lead_id: leadId,
      author_id: session.user.id,
      content: content.trim(),
      note_type: noteType,
    })
    .select(NOTE_SELECT)
    .single()

  if (error) throw new SupabaseError(error.message)

  await logActivity(
    supabase,
    leadId,
    session.user.id,
    actorNameFromSession(session),
    'note_added',
    { note_id: (data as LeadNote).id, note_type: noteType },
  )

  return data as LeadNote
}

export async function deleteLeadNote(
  noteId: string,
  leadId: string,
): Promise<void> {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: note, error: fetchError } = await supabase
    .from('lead_notes')
    .select('*')
    .eq('id', noteId)
    .eq('lead_id', leadId)
    .maybeSingle()

  if (fetchError) throw new SupabaseError(fetchError.message)
  if (!note) throw new NotFoundError('Note not found')

  if (session.role !== 'admin' && note.author_id !== session.user.id) {
    throw new ForbiddenError('Cannot delete this note')
  }

  const { error } = await supabase.from('lead_notes').delete().eq('id', noteId)
  if (error) throw new SupabaseError(error.message)

  await logActivity(
    supabase,
    leadId,
    session.user.id,
    actorNameFromSession(session),
    'note_deleted',
    { note_id: noteId },
  )
}

export async function getLeadAttachments(
  leadId: string,
): Promise<LeadAttachment[]> {
  await requireSession()
  await getLead(leadId)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lead_attachments')
    .select(ATTACHMENT_SELECT)
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)
  return (data ?? []) as LeadAttachment[]
}

export async function createLeadAttachment(
  leadId: string,
  data: {
    file_name: string
    file_url: string
    file_size: number
    mime_type?: string | null
    note_id?: string | null
  },
): Promise<LeadAttachment> {
  const session = await requireSession()
  await getLead(leadId)

  const supabase = await createClient()
  const { data: row, error } = await supabase
    .from('lead_attachments')
    .insert({
      lead_id: leadId,
      uploaded_by: session.user.id,
      file_name: data.file_name,
      file_url: data.file_url,
      file_size: data.file_size,
      mime_type: data.mime_type ?? null,
      note_id: data.note_id ?? null,
    })
    .select(ATTACHMENT_SELECT)
    .single()

  if (error) throw new SupabaseError(error.message)

  await logActivity(
    supabase,
    leadId,
    session.user.id,
    actorNameFromSession(session),
    'attachment_added',
    { file_name: data.file_name },
  )

  return row as LeadAttachment
}

export async function deleteLeadAttachment(
  attachmentId: string,
  leadId: string,
): Promise<void> {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: attachment, error: fetchError } = await supabase
    .from('lead_attachments')
    .select('*')
    .eq('id', attachmentId)
    .eq('lead_id', leadId)
    .maybeSingle()

  if (fetchError) throw new SupabaseError(fetchError.message)
  if (!attachment) throw new NotFoundError('Attachment not found')

  const isOwner = attachment.uploaded_by === session.user.id
  const isAdminOrManager =
    session.role === 'admin' || session.role === 'manager'
  if (!isOwner && !isAdminOrManager) {
    throw new ForbiddenError('Cannot delete this attachment')
  }

  const { error } = await supabase
    .from('lead_attachments')
    .delete()
    .eq('id', attachmentId)

  if (error) throw new SupabaseError(error.message)

  await logActivity(
    supabase,
    leadId,
    session.user.id,
    actorNameFromSession(session),
    'attachment_deleted',
    { file_name: attachment.file_name },
  )
}

export async function getLeadActivity(leadId: string): Promise<LeadActivity[]> {
  await requireSession()
  await getLead(leadId)
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('lead_activity' as never)
    .select('*')
    .eq('lead_id', leadId)
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)

  return ((data ?? []) as LeadActivity[]).map((row) => ({
    ...row,
    metadata:
      row.metadata && typeof row.metadata === 'object'
        ? (row.metadata as Record<string, unknown>)
        : {},
  }))
}
