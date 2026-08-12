export type ProjectStatus =
  | 'discovery'
  | 'in_progress'
  | 'review'
  | 'delivered'
  | 'retainer'
  | 'on_hold'

export type PaymentStatus = 'pending' | 'partial' | 'paid' | 'overdue'
export type TaskStatus = 'todo' | 'in_progress' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent'

export interface ProjectMember {
  id: string
  name: string
  avatar_url: string | null
  role: string
}

export interface ProjectTask {
  id: string
  title: string
  status: TaskStatus
  priority: TaskPriority
  assignee_name: string | null
  assignee_avatar: string | null
  due_date: string | null
}

export interface ProjectMilestone {
  id: string
  title: string
  due_date: string
  completed_at: string | null
}

export interface ProjectUpdate {
  id: string
  author_name: string
  author_avatar: string | null
  content: string
  is_client_visible: boolean
  created_at: string
  time_ago: string
}

export interface ProjectFile {
  id: string
  file_name: string
  file_size: string
  uploaded_at: string
  is_client_visible: boolean
  mime_type: string
}

export interface Project {
  id: string
  name: string
  description: string | null
  client_name: string | null
  service_type: string | null
  status: ProjectStatus
  payment_status: PaymentStatus
  fixed_price: number | null
  currency: string
  start_date: string | null
  deadline: string | null
  completion_pct: number
  is_client_visible: boolean
  team: ProjectMember[]
  tasks: ProjectTask[]
  milestones: ProjectMilestone[]
  updates: ProjectUpdate[]
  files: ProjectFile[]
  created_at: string
}
