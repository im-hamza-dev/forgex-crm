import {
  Clock,
  MessageSquare,
  FileText,
  FolderKanban,
  CheckSquare,
  UserPlus,
  Flag,
  Milestone,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export type NotificationType =
  | 'follow_up_due'
  | 'ticket_raised'
  | 'blog_needs_review'
  | 'project_updated'
  | 'task_assigned'
  | 'lead_assigned'
  | 'comment_needs_moderation'
  | 'milestone_completed'

export interface NotificationConfig {
  icon: LucideIcon
  color: string
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> =
  {
    follow_up_due: { icon: Clock, color: '#8B5E00' },
    ticket_raised: { icon: MessageSquare, color: '#8B1A1A' },
    blog_needs_review: { icon: FileText, color: '#9c6644' },
    project_updated: { icon: FolderKanban, color: '#4A1D6B' },
    task_assigned: { icon: CheckSquare, color: '#2D6A2D' },
    lead_assigned: { icon: UserPlus, color: '#1A3D6B' },
    comment_needs_moderation: { icon: Flag, color: '#8B5E00' },
    milestone_completed: { icon: Milestone, color: '#2D6A2D' },
  }

export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'leads'
  | 'projects'
  | 'tasks'
  | 'blog'
