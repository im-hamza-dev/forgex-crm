'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout'
import { Tabs } from '@/components/ui'
import { NotificationItem } from '@/components/notifications'
import { useNotifications } from '@/hooks/useNotifications'
import type { NotificationFilter } from '@/constants/notification-config'
import type { Notification } from '@/types/notifications'

const TYPE_TO_FILTER: Record<string, NotificationFilter> = {
  follow_up_due: 'leads',
  lead_assigned: 'leads',
  lead_note_added: 'leads',
  lead_stage_changed: 'leads',
  project_updated: 'projects',
  project_member_added: 'projects',
  project_overdue: 'projects',
  milestone_completed: 'projects',
  milestone_due_soon: 'projects',
  ticket_opened: 'projects',
  ticket_raised: 'projects',
  ticket_reply: 'projects',
  task_assigned: 'tasks',
  task_completed: 'tasks',
  task_comment_added: 'tasks',
  task_due_soon: 'tasks',
  task_overdue: 'tasks',
  blog_needs_review: 'blog',
  blog_post_published: 'blog',
  comment_needs_moderation: 'blog',
  calendar_assigned: 'calendar',
  calendar_due_today: 'calendar',
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

function filterNotifications(
  notifications: Notification[],
  filter: NotificationFilter,
): Notification[] {
  if (filter === 'all') return notifications
  if (filter === 'unread') return notifications.filter((n) => !n.is_read)
  return notifications.filter((n) => TYPE_TO_FILTER[n.type] === filter)
}

const NAVIGATION_MAP: Record<string, (id: string) => string> = {
  lead: (id) => `/leads?open=${id}`,
  task: (id) => `/tasks?open=${id}`,
  project: (id) => `/projects/${id}`,
  ticket: (id) => `/projects/${id}?tab=tickets`,
  blog_post: (id) => `/blog/${id}`,
  milestone: (id) => `/projects/${id}`,
  calendar: (_id) => `/content-calendar`,
  client_document: (_id) => `/docs?tab=client`,
}

export default function NotificationsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState<NotificationFilter>('all')
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  const enriched = notifications.map((n) => ({
    ...n,
    time_ago: timeAgo(n.created_at),
  }))

  const filtered = filterNotifications(enriched, activeTab)

  const filterTabs = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread', badge: unreadCount },
    { id: 'leads', label: 'Leads' },
    { id: 'projects', label: 'Projects' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'calendar', label: 'Calendar' },
    { id: 'blog', label: 'Blog' },
  ]

  const handleClick = (n: Notification) => {
    markAsRead(n.id)
    if (n.reference_type && n.reference_id) {
      const getRoute = NAVIGATION_MAP[n.reference_type]
      if (getRoute) router.push(getRoute(n.reference_id))
    }
  }

  return (
    <DashboardShell title="Notifications">
      <div className="flex items-center justify-between mb-4">
        <h2
          className="text-[22px] font-bold"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Notifications
        </h2>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={() => markAllAsRead()}
            className="h-[34px] px-4 rounded-lg text-[13px] font-medium border transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      <Tabs
        items={filterTabs}
        active={activeTab}
        onChange={(id) => setActiveTab(id as NotificationFilter)}
        className="mb-4"
      />

      <div
        className="rounded-xl border overflow-hidden"
        style={{
          borderColor: 'var(--color-border)',
          background: 'var(--color-surface)',
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p
              className="text-[14px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No notifications
            </p>
          </div>
        ) : (
          filtered.map((n, i) => (
            <NotificationItem
              key={n.id}
              notification={n}
              isLast={i === filtered.length - 1}
              onClick={() => handleClick(n)}
            />
          ))
        )}
      </div>
    </DashboardShell>
  )
}
