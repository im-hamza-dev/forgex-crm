export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface Task {
  id: string
  title: string
  description: string | null
  project_id: string | null
  project_name: string | null
  assigned_to: string | null
  assignee_name: string | null
  assignee_avatar: string | null
  status: TaskStatus
  priority: TaskPriority
  due_date: string | null
  subtask_total: number
  subtask_done: number
  created_at: string
}
