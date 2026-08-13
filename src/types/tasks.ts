import type { Database } from './database.types'

export type TaskStatus = Database['public']['Enums']['task_status']
export type TaskPriority = Database['public']['Enums']['task_priority']

export type Task = Database['public']['Tables']['tasks']['Row'] & {
  assigned_profile?: {
    full_name: string | null
    avatar_url: string | null
  } | null
  created_profile?: {
    full_name: string | null
    avatar_url: string | null
  } | null
  project?: {
    id: string
    name: string
  } | null
  milestone?: {
    id: string
    title: string
  } | null
  comment_count?: number
  subtask_count?: number
  subtask_done_count?: number
  subtasks?: Task[]
}

export type TaskInsert = Database['public']['Tables']['tasks']['Insert']
export type TaskUpdate = Database['public']['Tables']['tasks']['Update']

export type TaskComment =
  Database['public']['Tables']['task_comments']['Row'] & {
    author?: {
      full_name: string | null
      avatar_url: string | null
    } | null
  }

export type TaskFilters = {
  search?: string
  status?: string
  priority?: string
  project_id?: string
  assigned_to?: string
  due?: 'today' | 'week' | 'overdue'
}
