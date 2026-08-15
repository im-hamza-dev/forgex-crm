export type NotificationType =
  | 'lead_assigned'
  | 'lead_note_added'
  | 'lead_stage_changed'
  | 'follow_up_due'
  | 'task_assigned'
  | 'task_completed'
  | 'task_comment_added'
  | 'task_due_soon'
  | 'task_overdue'
  | 'project_updated'
  | 'project_member_added'
  | 'project_overdue'
  | 'milestone_completed'
  | 'milestone_due_soon'
  | 'ticket_opened'
  | 'ticket_raised'
  | 'ticket_reply'
  | 'blog_needs_review'
  | 'blog_post_published'
  | 'comment_needs_moderation'
  | 'calendar_assigned'
  | 'calendar_due_today'
  | 'client_doc_sent'
  | 'client_invited'
  | 'team_member_joined'

export type NotificationReferenceType =
  | 'lead'
  | 'project'
  | 'task'
  | 'ticket'
  | 'blog_post'
  | 'blog_comment'
  | 'milestone'
  | 'calendar'
  | 'client_document'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  body: string | null
  reference_type: NotificationReferenceType | null
  reference_id: string | null
  actor_id: string | null
  actor_name: string | null
  metadata: Record<string, unknown>
  is_read: boolean
  is_dismissed: boolean
  email_sent: boolean
  email_sent_at: string | null
  created_at: string
  read_at: string | null
  time_ago?: string
  actor?: {
    full_name: string | null
    avatar_url: string | null
  } | null
}

export interface CreateNotificationInput {
  user_id: string
  type: NotificationType
  title: string
  body?: string
  reference_type?: NotificationReferenceType
  reference_id?: string
  actor_id?: string
  actor_name?: string
  metadata?: Record<string, unknown>
}

export interface NotificationFilters {
  unread_only?: boolean
  limit?: number
  offset?: number
}
