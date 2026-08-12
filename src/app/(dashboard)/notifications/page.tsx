'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/layout'
import { Tabs } from '@/components/ui'
import { NotificationItem } from '@/components/notifications'
import { MOCK_NOTIFICATIONS } from '@/components/notifications/mock-data'
import type { NotificationFilter } from '@/constants/notification-config'
import type { Notification } from '@/types/notifications'

const TYPE_TO_FILTER: Record<string, NotificationFilter> = {
  follow_up_due: 'leads',
  lead_assigned: 'leads',
  project_updated: 'projects',
  ticket_raised: 'projects',
  task_assigned: 'tasks',
  blog_needs_review: 'blog',
  comment_needs_moderation: 'blog',
}

function filterNotifications(
  notifications: Notification[],
  filter: NotificationFilter,
): Notification[] {
  if (filter === 'all') return notifications
  if (filter === 'unread') return notifications.filter((n) => !n.is_read)
  return notifications.filter((n) => TYPE_TO_FILTER[n.type] === filter)
}

export default function NotificationsPage() {
  const [activeTab, setActiveTab] = useState<NotificationFilter>('all')
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS)

  const unreadCount = notifications.filter((n) => !n.is_read).length
  const filtered = filterNotifications(notifications, activeTab)

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', badge: unreadCount },
    { id: 'leads', label: 'Leads' },
    { id: 'projects', label: 'Projects' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'blog', label: 'Blog' },
  ]

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
  }

  const markOneRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)),
    )
  }

  return (
    <DashboardShell title="Notifications" notificationCount={3}>
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-[22px] font-bold"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Notifications
        </h2>
        <button
          type="button"
          onClick={markAllRead}
          className="h-[34px] px-4 rounded-lg text-[13px] font-medium border transition-colors hover:bg-[var(--color-surface-hover)]"
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
        >
          Mark all read
        </button>
      </div>

      <Tabs
        items={filterTabs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as NotificationFilter)}
        className="mb-4"
      />

      <div
        className="rounded-xl border bg-[var(--color-surface)] overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p
              className="text-[14px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No notifications
            </p>
          </div>
        ) : (
          filtered.map((notification, i) => (
            <NotificationItem
              key={notification.id}
              notification={notification}
              isLast={i === filtered.length - 1}
              onClick={() => markOneRead(notification.id)}
            />
          ))
        )}
      </div>
    </DashboardShell>
  )
}
