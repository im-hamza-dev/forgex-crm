'use client'

import { cn } from '@/lib/utils'
import { NOTIFICATION_CONFIG } from '@/constants/notification-config'
import type { Notification } from '@/types/notifications'

interface NotificationItemProps {
  notification: Notification
  isLast?: boolean
  onClick?: () => void
}

export function NotificationItem({
  notification,
  isLast,
  onClick,
}: NotificationItemProps) {
  const config = NOTIFICATION_CONFIG[notification.type]
  const Icon = config?.icon

  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-start gap-4 px-5 py-4 cursor-pointer transition-colors',
        'hover:bg-[var(--color-surface-hover)]',
        !isLast && 'border-b border-[var(--color-border)]',
        !notification.is_read && 'border-l-[3px] border-l-[var(--color-accent)]',
      )}
    >
      <div
        className="flex items-center justify-center w-8 h-8 rounded-lg shrink-0 mt-0.5"
        style={{ background: `${config?.color}15` }}
      >
        {Icon && <Icon size={16} style={{ color: config?.color }} />}
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[14px] font-semibold mb-0.5"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {notification.title}
        </p>
        <p
          className="text-[13px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {notification.body}
        </p>
      </div>

      <div className="flex flex-col items-end gap-1.5 shrink-0">
        <span
          className="text-[11px] whitespace-nowrap"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {notification.time_ago}
        </span>
        {!notification.is_read && (
          <span
            className="w-2 h-2 rounded-full"
            style={{ background: 'var(--color-accent)' }}
          />
        )}
      </div>
    </div>
  )
}
