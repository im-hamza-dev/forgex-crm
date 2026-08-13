'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireSession } from '@/server/shared/require-session'
import { ForbiddenError, SupabaseError } from '@/server/shared/errors'
import type {
  Task,
  TaskFilters,
  TaskPriority,
  TaskStatus,
  TaskUpdate,
} from '@/types/tasks'

type ProfileSnippet = {
  id: string
  full_name: string | null
  avatar_url: string | null
  role?: string
}

async function fetchProfiles(ids: string[]): Promise<Record<string, ProfileSnippet>> {
  if (ids.length === 0) return {}
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('id, full_name, avatar_url, role')
    .in('id', ids)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]))
}

function enrichTask(
  t: Task & {
    project?: { id: string; name: string } | null
    milestone?: { id: string; title: string } | null
  },
  profiles: Record<string, ProfileSnippet>,
): Task {
  return {
    ...t,
    assigned_profile: t.assigned_to
      ? {
          full_name: profiles[t.assigned_to]?.full_name ?? null,
          avatar_url: profiles[t.assigned_to]?.avatar_url ?? null,
        }
      : null,
    created_profile: t.created_by
      ? {
          full_name: profiles[t.created_by]?.full_name ?? null,
          avatar_url: profiles[t.created_by]?.avatar_url ?? null,
        }
      : null,
  }
}

const TASK_SELECT = `
  *,
  project:projects(id, name),
  milestone:project_milestones(id, title)
`

export async function getTasks(filters?: TaskFilters): Promise<Task[]> {
  const session = await requireSession()
  const supabase = await createClient()
  const isAdminOrManager =
    session.role === 'admin' || session.role === 'manager'

  let query = supabase
    .from('tasks')
    .select(TASK_SELECT)
    .is('parent_task_id', null)
    .order('created_at', { ascending: false })

  if (!isAdminOrManager) {
    query = query.or(
      `assigned_to.eq.${session.user.id},created_by.eq.${session.user.id}`,
    )
  }

  if (filters?.status) {
    query = query.eq('status', filters.status as TaskStatus)
  }
  if (filters?.priority) {
    query = query.eq('priority', filters.priority as TaskPriority)
  }
  if (filters?.project_id) query = query.eq('project_id', filters.project_id)
  if (filters?.assigned_to) query = query.eq('assigned_to', filters.assigned_to)
  if (filters?.search) query = query.ilike('title', `%${filters.search}%`)

  if (filters?.due === 'today') {
    const today = new Date().toISOString().split('T')[0]!
    query = query.eq('due_date', today)
  } else if (filters?.due === 'overdue') {
    const today = new Date().toISOString().split('T')[0]!
    query = query.lt('due_date', today).neq('status', 'done')
  } else if (filters?.due === 'week') {
    const today = new Date()
    const weekEnd = new Date(today)
    weekEnd.setDate(today.getDate() + 7)
    query = query
      .gte('due_date', today.toISOString().split('T')[0]!)
      .lte('due_date', weekEnd.toISOString().split('T')[0]!)
  }

  const { data, error } = await query
  if (error) throw new SupabaseError(error.message)

  const rows = (data ?? []) as unknown as Task[]
  const profileIds = [
    ...new Set(
      rows
        .flatMap((t) => [t.assigned_to, t.created_by])
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const profiles = await fetchProfiles(profileIds)

  return rows.map((t) => enrichTask(t, profiles))
}

export async function getTask(id: string): Promise<Task & { subtasks: Task[] }> {
  const session = await requireSession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('id', id)
    .single()

  if (error) throw new SupabaseError(error.message)

  const row = data as unknown as Task

  if (
    session.role === 'member' &&
    row.assigned_to !== session.user.id &&
    row.created_by !== session.user.id
  ) {
    throw new ForbiddenError('Access denied')
  }

  const { data: childRows, error: childError } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('parent_task_id', id)
    .order('created_at', { ascending: true })

  if (childError) throw new SupabaseError(childError.message)

  const children = (childRows ?? []) as unknown as Task[]
  const profileIds = [
    ...new Set(
      [row, ...children]
        .flatMap((t) => [t.assigned_to, t.created_by])
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const profiles = await fetchProfiles(profileIds)

  return {
    ...enrichTask(row, profiles),
    subtasks: children.map((t) => enrichTask(t, profiles)),
  }
}

export async function createTask(data: {
  title: string
  description?: string
  project_id?: string | null
  milestone_id?: string | null
  assigned_to?: string | null
  priority?: string
  status?: string
  due_date?: string | null
  estimated_hours?: number | null
  parent_task_id?: string | null
}) {
  const session = await requireSession()
  const supabase = await createClient()

  const assignedTo =
    session.role === 'member'
      ? session.user.id
      : (data.assigned_to ?? session.user.id)

  const projectId =
    session.role === 'member' ? null : (data.project_id ?? null)

  const { data: task, error } = await supabase
    .from('tasks')
    .insert({
      title: data.title,
      description: data.description || null,
      project_id: projectId,
      milestone_id: data.milestone_id || null,
      assigned_to: assignedTo,
      created_by: session.user.id,
      priority: (data.priority ?? 'medium') as TaskPriority,
      status: (data.status ?? 'todo') as TaskStatus,
      due_date: data.due_date || null,
      estimated_hours: data.estimated_hours ?? null,
      parent_task_id: data.parent_task_id ?? null,
    })
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return task
}

export async function updateTask(id: string, data: Partial<TaskUpdate>) {
  const session = await requireSession()
  const supabase = await createClient()

  if (session.role === 'member') {
    const { data: existing } = await supabase
      .from('tasks')
      .select('assigned_to, created_by')
      .eq('id', id)
      .single()

    if (
      existing?.assigned_to !== session.user.id &&
      existing?.created_by !== session.user.id
    ) {
      throw new ForbiddenError('Cannot edit this task')
    }

    // Members cannot reassign or change project link
    const { assigned_to: _a, project_id: _p, ...rest } = data
    data = rest
    void _a
    void _p
  }

  const updateData: Partial<TaskUpdate> = { ...data }
  if (data.status === 'done' && !data.completed_at) {
    updateData.completed_at = new Date().toISOString()
  } else if (data.status && data.status !== 'done') {
    updateData.completed_at = null
  }

  const { data: task, error } = await supabase
    .from('tasks')
    .update({ ...updateData, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return task
}

export async function deleteTask(id: string) {
  const session = await requireSession()
  const supabase = await createClient()

  if (session.role === 'member') {
    throw new ForbiddenError('Members cannot delete tasks')
  }

  if (session.role === 'manager') {
    const { data: existing } = await supabase
      .from('tasks')
      .select('created_by')
      .eq('id', id)
      .single()

    if (existing?.created_by !== session.user.id) {
      throw new ForbiddenError('Managers can only delete own tasks')
    }
  }

  const { error } = await supabase.from('tasks').delete().eq('id', id)
  if (error) throw new SupabaseError(error.message)
}

export async function getTaskComments(taskId: string) {
  await requireSession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) throw new SupabaseError(error.message)

  const authorIds = [...new Set((data ?? []).map((c) => c.author_id))]
  const profiles = await fetchProfiles(authorIds)

  return (data ?? []).map((c) => ({
    ...c,
    author: profiles[c.author_id]
      ? {
          full_name: profiles[c.author_id]!.full_name,
          avatar_url: profiles[c.author_id]!.avatar_url,
        }
      : null,
  }))
}

export async function createTaskComment(taskId: string, content: string) {
  const session = await requireSession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('task_comments')
    .insert({
      task_id: taskId,
      author_id: session.user.id,
      content,
    })
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return data
}

export async function deleteTaskComment(commentId: string) {
  const session = await requireSession()
  const supabase = await createClient()

  if (session.role !== 'admin') {
    const { data: existing } = await supabase
      .from('task_comments')
      .select('author_id')
      .eq('id', commentId)
      .single()

    if (existing?.author_id !== session.user.id) {
      throw new ForbiddenError('Cannot delete this comment')
    }
  }

  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('id', commentId)

  if (error) throw new SupabaseError(error.message)
}

export async function getProjectTasks(projectId: string): Promise<Task[]> {
  await requireSession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('tasks')
    .select(TASK_SELECT)
    .eq('project_id', projectId)
    .is('parent_task_id', null)
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)

  const rows = (data ?? []) as unknown as Task[]
  const profileIds = [
    ...new Set(
      rows
        .flatMap((t) => [t.assigned_to, t.created_by])
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const profiles = await fetchProfiles(profileIds)

  return rows.map((t) => enrichTask(t, profiles))
}
