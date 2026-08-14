'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireRole } from '@/server/shared/require-session'
import { ForbiddenError, NotFoundError, SupabaseError } from '@/server/shared/errors'
import type {
  CalendarEntry,
  CalendarEntryInsert,
  CalendarEntryStatus,
  CalendarEntryType,
} from '@/types/calendar'

type ProfileSnippet = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

type ContentCalendarRow = {
  id: string
  title: string
  planned_date: string | null
  status: CalendarEntryStatus
  blog_post_id: string | null
  assigned_to: string | null
  notes: string | null
  created_by: string
  created_at: string
  updated_at: string
  entry_type: string | null
  scheduled_time: string | null
  is_all_day: boolean | null
  color: string | null
  description: string | null
  source_type: string | null
  source_id: string | null
}

const ENTRY_TYPES: CalendarEntryType[] = [
  'content',
  'meeting',
  'deadline',
  'followup',
  'task',
  'other',
]

function isEntryType(value: string | null): value is CalendarEntryType {
  return value !== null && ENTRY_TYPES.includes(value as CalendarEntryType)
}

function dateOnly(value: string): string {
  return value.split('T')[0] ?? value
}

function monthBounds(year: number, month: number) {
  const startDate = `${year}-${String(month + 1).padStart(2, '0')}-01`
  const lastDay = new Date(year, month + 1, 0).getDate()
  const endDate = `${year}-${String(month + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`
  return { startDate, endDate }
}

function emptySystemFields() {
  return {
    status: 'scheduled' as const,
    blog_post_id: null,
    assigned_to: null,
    notes: null,
    created_by: null,
    created_at: '',
    updated_at: '',
    scheduled_time: null,
    is_all_day: true,
    color: null,
    description: null,
    is_system: true as const,
  }
}

async function fetchProfiles(ids: string[]) {
  if (ids.length === 0) return {} as Record<string, ProfileSnippet>
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', ids)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]))
}

export async function getCalendarEntries(
  year: number,
  month: number,
): Promise<CalendarEntry[]> {
  await requireRole(['admin', 'manager'])
  const supabase = await createClient()
  const { startDate, endDate } = monthBounds(year, month)

  const { data: manual, error } = await supabase
    .from('content_calendar')
    .select('*')
    .gte('planned_date', startDate)
    .lte('planned_date', endDate)
    .order('planned_date', { ascending: true })

  if (error) throw new SupabaseError(error.message)

  const rows = (manual ?? []) as unknown as ContentCalendarRow[]

  const profileIds = [
    ...new Set([
      ...rows.map((e) => e.assigned_to).filter((id): id is string => Boolean(id)),
      ...rows.map((e) => e.created_by).filter(Boolean),
    ]),
  ]
  const profiles = await fetchProfiles(profileIds)

  const manualEntries: CalendarEntry[] = rows
    .filter((e) => Boolean(e.planned_date))
    .map((e) => ({
      id: e.id,
      title: e.title,
      planned_date: e.planned_date as string,
      status: e.status,
      blog_post_id: e.blog_post_id,
      assigned_to: e.assigned_to,
      notes: e.notes,
      created_by: e.created_by,
      created_at: e.created_at,
      updated_at: e.updated_at,
      entry_type: isEntryType(e.entry_type) ? e.entry_type : 'content',
      scheduled_time: e.scheduled_time,
      is_all_day: e.is_all_day ?? true,
      color: e.color,
      description: e.description,
      source_type: e.source_type,
      source_id: e.source_id,
      is_system: false,
      assignee_name: e.assigned_to
        ? (profiles[e.assigned_to]?.full_name ?? null)
        : null,
      assignee_avatar: e.assigned_to
        ? (profiles[e.assigned_to]?.avatar_url ?? null)
        : null,
      creator_name: e.created_by
        ? (profiles[e.created_by]?.full_name ?? null)
        : null,
    }))

  const service = createServiceClient()
  const systemEntries: CalendarEntry[] = []

  const { data: leads } = await service
    .from('leads')
    .select('id, contact_name, next_follow_up')
    .gte('next_follow_up', startDate)
    .lte('next_follow_up', endDate)
    .not('next_follow_up', 'is', null)

  for (const lead of leads ?? []) {
    if (!lead.next_follow_up) continue
    systemEntries.push({
      id: `system-lead-${lead.id}`,
      title: `Follow-up: ${lead.contact_name}`,
      planned_date: dateOnly(lead.next_follow_up),
      entry_type: 'followup',
      source_type: 'lead',
      source_id: lead.id,
      ...emptySystemFields(),
    })
  }

  const { data: projects } = await service
    .from('projects')
    .select('id, name, deadline, start_date')
    .or(
      `and(deadline.gte.${startDate},deadline.lte.${endDate}),and(start_date.gte.${startDate},start_date.lte.${endDate})`,
    )

  for (const project of projects ?? []) {
    if (
      project.deadline &&
      project.deadline >= startDate &&
      project.deadline <= endDate
    ) {
      systemEntries.push({
        id: `system-project-deadline-${project.id}`,
        title: `Deadline: ${project.name}`,
        planned_date: dateOnly(project.deadline),
        entry_type: 'deadline',
        source_type: 'project',
        source_id: project.id,
        ...emptySystemFields(),
      })
    }
    if (
      project.start_date &&
      project.start_date >= startDate &&
      project.start_date <= endDate
    ) {
      systemEntries.push({
        id: `system-project-start-${project.id}`,
        title: `Start: ${project.name}`,
        planned_date: dateOnly(project.start_date),
        entry_type: 'deadline',
        source_type: 'project',
        source_id: project.id,
        ...emptySystemFields(),
      })
    }
  }

  const { data: milestones } = await service
    .from('project_milestones')
    .select('id, title, due_date, project_id')
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .not('due_date', 'is', null)
    .is('completed_at', null)

  for (const milestone of milestones ?? []) {
    if (!milestone.due_date) continue
    systemEntries.push({
      id: `system-milestone-${milestone.id}`,
      title: milestone.title,
      planned_date: dateOnly(milestone.due_date),
      entry_type: 'deadline',
      source_type: 'milestone',
      source_id: milestone.project_id,
      ...emptySystemFields(),
    })
  }

  const { data: tasks } = await service
    .from('tasks')
    .select('id, title, due_date')
    .gte('due_date', startDate)
    .lte('due_date', endDate)
    .not('due_date', 'is', null)
    .neq('status', 'done')

  for (const task of tasks ?? []) {
    if (!task.due_date) continue
    systemEntries.push({
      id: `system-task-${task.id}`,
      title: task.title,
      planned_date: dateOnly(task.due_date),
      entry_type: 'task',
      source_type: 'task',
      source_id: task.id,
      ...emptySystemFields(),
    })
  }

  const { data: blogPosts } = await service
    .from('blog_posts')
    .select('id, title, publish_date')
    .gte('publish_date', startDate)
    .lte('publish_date', endDate)
    .not('publish_date', 'is', null)
    .eq('status', 'scheduled')

  for (const post of blogPosts ?? []) {
    if (!post.publish_date) continue
    systemEntries.push({
      id: `system-blog-${post.id}`,
      title: post.title,
      planned_date: dateOnly(post.publish_date),
      entry_type: 'content',
      source_type: 'blog',
      source_id: post.id,
      blog_post_id: post.id,
      assigned_to: null,
      notes: null,
      created_by: null,
      created_at: '',
      updated_at: '',
      scheduled_time: null,
      is_all_day: true,
      color: null,
      description: null,
      is_system: true,
      status: 'scheduled',
    })
  }

  return [...manualEntries, ...systemEntries].sort((a, b) =>
    a.planned_date.localeCompare(b.planned_date),
  )
}

export async function createCalendarEntry(data: CalendarEntryInsert) {
  const session = await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const payload = {
    title: data.title,
    planned_date: data.planned_date,
    entry_type: data.entry_type,
    status: data.status ?? 'idea',
    blog_post_id: data.blog_post_id ?? null,
    assigned_to: data.assigned_to ?? null,
    notes: data.notes ?? null,
    description: data.description ?? null,
    scheduled_time: data.scheduled_time ?? null,
    is_all_day: data.is_all_day ?? true,
    color: data.color ?? null,
    source_type: data.source_type ?? null,
    source_id: data.source_id ?? null,
    created_by: session.user.id,
  }

  const { data: entry, error } = await supabase
    .from('content_calendar')
    .insert(payload as never)
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return entry as unknown as CalendarEntry
}

export async function updateCalendarEntry(
  id: string,
  data: Partial<CalendarEntryInsert>,
) {
  const session = await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('content_calendar')
    .select('created_by, assigned_to')
    .eq('id', id)
    .single()

  if (!existing) throw new NotFoundError('Entry not found')

  const canEdit =
    session.role === 'admin' ||
    existing.created_by === session.user.id ||
    existing.assigned_to === session.user.id

  if (!canEdit) throw new ForbiddenError('Cannot edit this entry')

  const { data: entry, error } = await supabase
    .from('content_calendar')
    .update({
      ...data,
      updated_at: new Date().toISOString(),
    } as never)
    .eq('id', id)
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return entry as unknown as CalendarEntry
}

export async function deleteCalendarEntry(id: string) {
  const session = await requireRole(['admin', 'manager'])
  const supabase = await createClient()

  const { data: existing } = await supabase
    .from('content_calendar')
    .select('created_by')
    .eq('id', id)
    .single()

  if (!existing) throw new NotFoundError('Entry not found')

  const canDelete =
    session.role === 'admin' || existing.created_by === session.user.id

  if (!canDelete) throw new ForbiddenError('Cannot delete this entry')

  const { error } = await supabase.from('content_calendar').delete().eq('id', id)

  if (error) throw new SupabaseError(error.message)
}
