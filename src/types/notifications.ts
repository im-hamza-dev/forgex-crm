import type { NotificationType } from '@/constants/notification-config'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  body: string
  time_ago: string
  is_read: boolean
  reference_type: string | null
  reference_id: string | null
}
