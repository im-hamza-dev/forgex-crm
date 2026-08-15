import {
  Clock,
  MessageSquare,
  FileText,
  FolderKanban,
  CheckSquare,
  UserPlus,
  Flag,
  Milestone,
  CalendarDays,
  ThumbsUp,
  Send,
  AlertTriangle,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { NotificationType } from '@/types/notifications'

export interface NotificationConfig {
  icon: LucideIcon
  color: string
}

export const NOTIFICATION_CONFIG: Record<NotificationType, NotificationConfig> =
  {
    lead_assigned: { icon: UserPlus, color: '#1A3D6B' },
    lead_note_added: { icon: MessageSquare, color: '#1A3D6B' },
    lead_stage_changed: { icon: Flag, color: '#1A3D6B' },
    follow_up_due: { icon: Clock, color: '#8B5E00' },

    task_assigned: { icon: CheckSquare, color: '#2D6A2D' },
    task_completed: { icon: ThumbsUp, color: '#2D6A2D' },
    task_comment_added: { icon: MessageSquare, color: '#2D6A2D' },
    task_due_soon: { icon: Clock, color: '#8B5E00' },
    task_overdue: { icon: AlertTriangle, color: '#DC2626' },

    project_updated: { icon: FolderKanban, color: '#4A1D6B' },
    project_member_added: { icon: Users, color: '#4A1D6B' },
    project_overdue: { icon: AlertTriangle, color: '#DC2626' },

    milestone_completed: { icon: Milestone, color: '#2D6A2D' },
    milestone_due_soon: { icon: Milestone, color: '#8B5E00' },

    ticket_opened: { icon: MessageSquare, color: '#8B1A1A' },
    ticket_raised: { icon: MessageSquare, color: '#8B1A1A' },
    ticket_reply: { icon: MessageSquare, color: '#8B1A1A' },

    blog_needs_review: { icon: FileText, color: '#9c6644' },
    blog_post_published: { icon: FileText, color: '#2D6A2D' },
    comment_needs_moderation: { icon: Flag, color: '#8B5E00' },

    calendar_assigned: { icon: CalendarDays, color: '#1A3D6B' },
    calendar_due_today: { icon: CalendarDays, color: '#8B5E00' },

    client_doc_sent: { icon: Send, color: '#9c6644' },
    client_invited: { icon: Users, color: '#4A1D6B' },
    team_member_joined: { icon: Users, color: '#4A1D6B' },
  }

export type NotificationFilter =
  | 'all'
  | 'unread'
  | 'leads'
  | 'projects'
  | 'tasks'
  | 'blog'
  | 'calendar'
