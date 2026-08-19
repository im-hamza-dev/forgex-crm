import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { ENV } from '@/constants/env'
import { requireRole } from '@/server/shared/require-session'
import {
  ForbiddenError,
  NotFoundError,
  SupabaseError,
  ValidationError,
} from '@/server/shared/errors'
import { createNotification } from '@/server/notifications/notifications.server'
import { sendNotificationEmail, sendClientInviteEmail } from '@/lib/notifications/email'
import type {
  ClientTicket,
  PaymentStatus,
  Project,
  ProjectFeedUpdate,
  ProjectFile,
  ProjectMember,
  ProjectMilestone,
  ProjectStatus,
  ProjectTaskRow,
  ProjectUpdate,
  ServiceType,
  TicketMessage,
} from '@/types/projects'

type ProfileSnippet = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role: string
}

async function fetchProfiles(
  ids: string[],
): Promise<Record<string, ProfileSnippet>> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (unique.length === 0) return {}
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .in('id', unique)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]))
}

export async function getProjects(): Promise<Project[]> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      client_account:client_accounts!projects_client_account_id_fkey(id, full_name, company, email, status)
    `,
    )
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)

  const service = createServiceClient()
  const projectIds = (data ?? []).map((p) => p.id)

  const membersMap: Record<string, ProjectMember[]> = {}
  if (projectIds.length > 0) {
    const { data: members } = await service
      .from('project_members')
      .select('*')
      .in('project_id', projectIds)

    const memberUserIds = [
      ...new Set((members ?? []).map((m) => m.user_id)),
    ]
    const profiles = await fetchProfiles(memberUserIds)

    for (const m of members ?? []) {
      const list = membersMap[m.project_id] ?? []
      list.push({
        ...m,
        profile: profiles[m.user_id]
          ? {
              full_name: profiles[m.user_id]!.full_name,
              avatar_url: profiles[m.user_id]!.avatar_url,
              role: profiles[m.user_id]!.role,
            }
          : null,
      })
      membersMap[m.project_id] = list
    }
  }

  return (data ?? []).map((p) => ({
    ...p,
    members: membersMap[p.id] ?? [],
  })) as Project[]
}

export async function getProject(id: string): Promise<Project> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('projects')
    .select(
      `
      *,
      client_account:client_accounts!projects_client_account_id_fkey(id, full_name, company, email, status)
    `,
    )
    .eq('id', id)
    .maybeSingle()

  if (error) throw new SupabaseError(error.message)
  if (!data) throw new NotFoundError('Project not found')

  const service = createServiceClient()
  const { data: members } = await service
    .from('project_members')
    .select('*')
    .eq('project_id', id)

  const memberUserIds = [...new Set((members ?? []).map((m) => m.user_id))]
  const profiles = await fetchProfiles(memberUserIds)

  return {
    ...data,
    members: (members ?? []).map((m) => ({
      ...m,
      profile: profiles[m.user_id]
        ? {
            full_name: profiles[m.user_id]!.full_name,
            avatar_url: profiles[m.user_id]!.avatar_url,
            role: profiles[m.user_id]!.role,
          }
        : null,
    })),
  } as Project
}

export async function createProject(input: {
  name: string
  description?: string
  service_type?: string
  status?: string
  payment_status?: string
  fixed_price?: number
  currency?: string
  start_date?: string
  deadline?: string
  completion_pct?: number
  is_client_visible?: boolean
  client_account_id?: string
  lead_id?: string
}): Promise<Project> {
  const session = await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      name: input.name,
      description: input.description || null,
      service_type: (input.service_type as ServiceType | undefined) ?? null,
      status: (input.status as ProjectStatus | undefined) ?? 'discovery',
      payment_status:
        (input.payment_status as PaymentStatus | undefined) ?? 'pending',
      fixed_price: input.fixed_price ?? null,
      currency: input.currency ?? 'USD',
      start_date: input.start_date || null,
      deadline: input.deadline || null,
      completion_pct: input.completion_pct ?? 0,
      is_client_visible: input.is_client_visible ?? false,
      client_account_id: input.client_account_id || null,
      created_by: session.user.id,
    })
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)

  const service = createServiceClient()
  const { data: adminManagers } = await service
    .from('profiles')
    .select('id')
    .in('role', ['admin', 'manager'])
    .eq('is_active', true)

  if (adminManagers && adminManagers.length > 0) {
    await service.from('project_members').insert(
      adminManagers.map((p) => ({
        project_id: project.id,
        user_id: p.id,
      })),
    )
  }

  if (input.lead_id) {
    await service
      .from('leads')
      .update({
        converted_project_id: project.id,
        status: 'won',
        stage: 'won',
      })
      .eq('id', input.lead_id)
  }

  return getProject(project.id)
}

export async function updateProject(
  id: string,
  data: Partial<ProjectUpdate>,
): Promise<Project> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('projects')
    .update({ ...data, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return getProject(updated.id)
}

export async function deleteProject(id: string): Promise<void> {
  await requireRole(['admin'])
  const supabase = await createClient()
  const { error } = await supabase.from('projects').delete().eq('id', id)
  if (error) throw new SupabaseError(error.message)
}

export async function getMilestones(
  projectId: string,
): Promise<ProjectMilestone[]> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_milestones')
    .select('*')
    .eq('project_id', projectId)
    .order('due_date', { ascending: true })
  if (error) throw new SupabaseError(error.message)
  return (data ?? []) as ProjectMilestone[]
}

export async function createMilestone(
  projectId: string,
  data: { title: string; description?: string; due_date?: string },
): Promise<ProjectMilestone> {
  const session = await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data: milestone, error } = await supabase
    .from('project_milestones')
    .insert({
      project_id: projectId,
      title: data.title,
      description: data.description || null,
      due_date: data.due_date || null,
      created_by: session.user.id,
    })
    .select()
    .single()
  if (error) throw new SupabaseError(error.message)
  return milestone as ProjectMilestone
}

export async function completeMilestone(
  id: string,
): Promise<ProjectMilestone> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_milestones')
    .update({ completed_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new SupabaseError(error.message)
  return data as ProjectMilestone
}

export async function deleteMilestone(id: string): Promise<void> {
  await requireRole(['admin'])
  const supabase = await createClient()
  const { error } = await supabase
    .from('project_milestones')
    .delete()
    .eq('id', id)
  if (error) throw new SupabaseError(error.message)
}

export async function getProjectUpdates(
  projectId: string,
): Promise<ProjectFeedUpdate[]> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_updates')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw new SupabaseError(error.message)

  const authorIds = [...new Set((data ?? []).map((u) => u.author_id))]
  const profiles = await fetchProfiles(authorIds)

  return (data ?? []).map((u) => ({
    ...u,
    author: profiles[u.author_id]
      ? {
          full_name: profiles[u.author_id]!.full_name,
          avatar_url: profiles[u.author_id]!.avatar_url,
        }
      : null,
  }))
}

export async function createProjectUpdate(
  projectId: string,
  data: { content: string; is_client_visible?: boolean },
): Promise<ProjectFeedUpdate> {
  const session = await requireRole(['admin', 'manager'])
  if (!data.content.trim()) throw new ValidationError('Content is required')
  const supabase = await createClient()
  const { data: update, error } = await supabase
    .from('project_updates')
    .insert({
      project_id: projectId,
      author_id: session.user.id,
      content: data.content.trim(),
      is_client_visible: data.is_client_visible ?? false,
    })
    .select()
    .single()
  if (error) throw new SupabaseError(error.message)
  return update as ProjectFeedUpdate
}

export async function toggleUpdateVisibility(
  id: string,
  visible: boolean,
): Promise<ProjectFeedUpdate> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_updates')
    .update({ is_client_visible: visible })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new SupabaseError(error.message)
  return data as ProjectFeedUpdate
}

export async function deleteProjectUpdate(id: string): Promise<void> {
  const session = await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('project_updates')
    .select('author_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw new SupabaseError(fetchError.message)
  if (!existing) throw new NotFoundError('Update not found')
  if (
    session.role !== 'admin' &&
    existing.author_id !== session.user.id
  ) {
    throw new ForbiddenError('Cannot delete this update')
  }

  const { error } = await supabase.from('project_updates').delete().eq('id', id)
  if (error) throw new SupabaseError(error.message)
}

export async function getProjectFiles(
  projectId: string,
): Promise<ProjectFile[]> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_files')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw new SupabaseError(error.message)

  const uploaderIds = [...new Set((data ?? []).map((f) => f.uploaded_by))]
  const profiles = await fetchProfiles(uploaderIds)

  return (data ?? []).map((f) => ({
    ...f,
    uploader: profiles[f.uploaded_by]
      ? {
          full_name: profiles[f.uploaded_by]!.full_name,
          avatar_url: profiles[f.uploaded_by]!.avatar_url,
        }
      : null,
  }))
}

export async function createProjectFile(
  projectId: string,
  data: {
    file_name: string
    file_url: string
    file_size?: number
    mime_type?: string | null
    is_client_visible?: boolean
  },
): Promise<ProjectFile> {
  const session = await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data: file, error } = await supabase
    .from('project_files')
    .insert({
      project_id: projectId,
      uploaded_by: session.user.id,
      file_name: data.file_name,
      file_url: data.file_url,
      file_size: data.file_size ?? null,
      mime_type: data.mime_type ?? null,
      is_client_visible: data.is_client_visible ?? false,
    })
    .select()
    .single()
  if (error) throw new SupabaseError(error.message)
  return file as ProjectFile
}

export async function toggleFileVisibility(
  id: string,
  visible: boolean,
): Promise<ProjectFile> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('project_files')
    .update({ is_client_visible: visible })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new SupabaseError(error.message)
  return data as ProjectFile
}

export async function deleteProjectFile(id: string): Promise<void> {
  const session = await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('project_files')
    .select('uploaded_by')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) throw new SupabaseError(fetchError.message)
  if (!existing) throw new NotFoundError('File not found')
  if (
    session.role !== 'admin' &&
    existing.uploaded_by !== session.user.id
  ) {
    throw new ForbiddenError('Cannot delete this file')
  }

  const { error } = await supabase.from('project_files').delete().eq('id', id)
  if (error) throw new SupabaseError(error.message)
}

export async function getProjectTickets(
  projectId: string,
): Promise<ClientTicket[]> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_tickets')
    .select(
      `
      *,
      client_account:client_accounts(full_name, company, email)
    `,
    )
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw new SupabaseError(error.message)
  return (data ?? []) as ClientTicket[]
}

export async function getTicketMessages(
  ticketId: string,
): Promise<TicketMessage[]> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_ticket_messages')
    .select(
      `
      *,
      client_sender:client_accounts(full_name)
    `,
    )
    .eq('ticket_id', ticketId)
    .order('created_at', { ascending: true })
  if (error) throw new SupabaseError(error.message)

  const teamSenderIds = [
    ...new Set(
      (data ?? [])
        .map((m) => m.team_sender_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const profiles = await fetchProfiles(teamSenderIds)

  return (data ?? []).map((m) => ({
    ...m,
    team_sender: m.team_sender_id
      ? {
          full_name: profiles[m.team_sender_id]?.full_name ?? null,
          avatar_url: profiles[m.team_sender_id]?.avatar_url ?? null,
        }
      : null,
  })) as TicketMessage[]
}

export async function replyToTicket(
  ticketId: string,
  content: string,
  attachments?: {
    name: string
    url: string
    size: number
    mimeType: string
  }[],
): Promise<TicketMessage> {
  const session = await requireRole(['admin', 'manager'])
  if (!content.trim() && !(attachments && attachments.length > 0)) {
    throw new ValidationError('Content is required')
  }
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_ticket_messages')
    .insert({
      ticket_id: ticketId,
      sender_type: 'team' as const,
      team_sender_id: session.user.id,
      client_sender_id: null,
      content: content.trim(),
      attachments: (attachments ?? []) as unknown as import('@/types/database.types').Json,
    })
    .select()
    .single()
  if (error) throw new SupabaseError(error.message)

  const service = createServiceClient()
  const { data: ticket } = await service
    .from('client_tickets')
    .select('subject, client_account_id, project_id')
    .eq('id', ticketId)
    .single()

  if (ticket) {
    const { data: account } = await service
      .from('client_accounts')
      .select('auth_user_id')
      .eq('id', ticket.client_account_id)
      .single()

    if (account?.auth_user_id) {
      void createNotification({
        user_id: account.auth_user_id,
        type: 'ticket_reply',
        title: 'New reply on your request',
        body: `Forgex Team replied to "${ticket.subject}"`,
        reference_type: 'ticket',
        reference_id: ticketId,
        metadata: { ticket_subject: ticket.subject },
      })

      const { data: clientProfile } = await service
        .from('profiles')
        .select('email, full_name, updated_at')
        .eq('id', account.auth_user_id)
        .single()

      if (clientProfile?.email) {
        void sendNotificationEmail({
          user_id: account.auth_user_id,
          type: 'ticket_reply',
          title: `Re: ${ticket.subject ?? 'Support request'}`,
          body: content.trim(),
          reference_type: 'ticket',
          reference_id: ticketId,
          actor_name: session.user.email ?? undefined,
          metadata: { ticket_subject: ticket.subject ?? '' },
        })
      }
    }
  }

  return data as TicketMessage
}

export async function updateTicketStatus(
  id: string,
  status: 'open' | 'in_progress' | 'resolved' | 'closed',
): Promise<ClientTicket> {
  const session = await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('client_tickets')
    .update({
      status,
      ...(status === 'resolved'
        ? {
            resolved_by: session.user.id,
            resolved_at: new Date().toISOString(),
          }
        : {}),
    })
    .eq('id', id)
    .select()
    .single()
  if (error) throw new SupabaseError(error.message)

  if (status === 'resolved') {
    const service = createServiceClient()
    const { data: ticket } = await service
      .from('client_tickets')
      .select('subject, client_account_id')
      .eq('id', id)
      .single()

    if (ticket) {
      const { data: account } = await service
        .from('client_accounts')
        .select('auth_user_id')
        .eq('id', ticket.client_account_id)
        .single()

      if (account?.auth_user_id) {
        void createNotification({
          user_id: account.auth_user_id,
          type: 'ticket_reply',
          title: 'Your request has been resolved',
          body: `"${ticket.subject}" has been marked as resolved`,
          reference_type: 'ticket',
          reference_id: id,
          metadata: { ticket_subject: ticket.subject },
        })

        void sendNotificationEmail({
          user_id: account.auth_user_id,
          type: 'ticket_reply',
          title: `Your request has been resolved: ${ticket.subject}`,
          body: `Your support request "${ticket.subject}" has been marked as resolved by the Forgex team.`,
          reference_type: 'ticket',
          reference_id: id,
          metadata: { ticket_subject: ticket.subject ?? '' },
        })
      }
    }
  }

  return data as ClientTicket
}

export async function inviteClient(
  projectId: string,
  input: { email: string; full_name: string; company?: string },
) {
  const session = await requireRole(['admin', 'manager'])
  const service = createServiceClient()

  const { data: existing } = await service
    .from('client_accounts')
    .select('id, status')
    .eq('project_id', projectId)
    .in('status', ['pending', 'active'])
    .limit(1)
    .maybeSingle()

  if (existing) {
    if (existing.status === 'active') {
      throw new ValidationError(
        'This client already has active access to this project',
      )
    }
    throw new ValidationError('An invite has already been sent to this email')
  }

  const { data: clientAccount, error: accountError } = await service
    .from('client_accounts')
    .insert({
      project_id: projectId,
      email: input.email,
      full_name: input.full_name,
      company: input.company ?? null,
      created_by: session.user.id,
      status: 'pending',
    })
    .select('id')
    .single()

  if (accountError) throw new SupabaseError(accountError.message)

  const { data: linkData, error: linkError } =
    await service.auth.admin.generateLink({
      type: 'invite',
      email: input.email,
      options: {
        data: {
          invited_role: 'client',
          is_client: true,
          full_name: input.full_name,
          company: input.company ?? null,
          project_id: projectId,
        },
        redirectTo: `${ENV.APP_URL}/portal/accept`,
      },
    })

  if (linkError) {
    await service.from('client_accounts').delete().eq('id', clientAccount.id)
    throw new ValidationError(linkError.message)
  }

  if (linkData.user?.id) {
    await service
      .from('client_accounts')
      .update({ auth_user_id: linkData.user.id })
      .eq('id', clientAccount.id)
  }

  const { data: project } = await service
    .from('projects')
    .select('name')
    .eq('id', projectId)
    .single()

  void sendClientInviteEmail({
    clientEmail: input.email,
    clientName: input.full_name,
    projectName: project?.name ?? 'your project',
    company: input.company ?? null,
    inviteUrl: linkData.properties.action_link,
  }).catch((err) => {
    console.error('[inviteClient] email send failed:', err)
  })

  await service
    .from('projects')
    .update({ client_account_id: clientAccount.id })
    .eq('id', projectId)

  return { success: true, clientAccountId: clientAccount.id }
}

export async function getProjectTasks(
  projectId: string,
): Promise<ProjectTaskRow[]> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
  if (error) throw new SupabaseError(error.message)

  const assigneeIds = [
    ...new Set(
      (data ?? [])
        .map((t) => t.assigned_to)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const profiles = await fetchProfiles(assigneeIds)

  return (data ?? []).map((t) => ({
    ...t,
    assignee: t.assigned_to
      ? {
          full_name: profiles[t.assigned_to]?.full_name ?? null,
          avatar_url: profiles[t.assigned_to]?.avatar_url ?? null,
        }
      : null,
  }))
}
