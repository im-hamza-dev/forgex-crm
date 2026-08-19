'use client'

import { use, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, ChevronLeft } from 'lucide-react'
import { useNotifications } from '@/hooks/useNotifications'
import { PortalHeader } from '@/components/client-portal'
import { createClient } from '@/lib/supabase/client'
import { usePortalOverview } from '@/hooks/usePortal'

type NotifFilter = 'all' | 'unread' | 'tickets' | 'documents' | 'updates'

const FILTER_TABS: { id: NotifFilter; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'unread', label: 'Unread' },
  { id: 'tickets', label: 'Tickets' },
  { id: 'documents', label: 'Documents' },
  { id: 'updates', label: 'Updates' },
]

const TYPE_TO_FILTER: Record<string, NotifFilter> = {
  ticket_reply: 'tickets',
  ticket_opened: 'tickets',
  ticket_raised: 'tickets',
  client_doc_sent: 'documents',
  project_updated: 'updates',
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

function getIcon(type: string): string {
  if (type.includes('ticket')) return '💬'
  if (type.includes('doc')) return '📄'
  if (type.includes('file')) return '📎'
  if (type.includes('project') || type.includes('update')) return '📋'
  return '🔔'
}

function initialsFrom(name: string): string {
  return name
    .split(' ')
    .map((w) => w.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

export default function PortalNotificationsPage({
  params,
}: {
  params: Promise<{ projectId: string }>
}) {
  const { projectId } = use(params)
  const router = useRouter()
  const [activeFilter, setActiveFilter] = useState<NotifFilter>('all')

  const { data: overview } = usePortalOverview(projectId)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
  } = useNotifications()

  const project = overview?.project
  const clientName = project?.client_name?.split(' ')[0] ?? ''
  const clientInitials = initialsFrom(
    project?.client_name ?? project?.client_email ?? 'C',
  )

  const filtered = notifications.filter((n) => {
    if (activeFilter === 'unread') return !n.is_read
    if (activeFilter === 'all') return true
    return TYPE_TO_FILTER[n.type] === activeFilter
  })

  const handleNotificationClick = (n: (typeof notifications)[0]) => {
    markAsRead(n.id)

    const base = `/portal/${projectId}`
    if (n.type === 'ticket_reply' || n.type === 'ticket_opened') {
      router.push(`${base}?tab=support`)
    } else if (n.type === 'client_doc_sent') {
      router.push(`${base}?tab=documents`)
    } else if (n.type === 'project_updated') {
      router.push(`${base}?tab=updates`)
    } else {
      router.push(base)
    }
  }

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/login')
  }

  const bellNotifications = notifications.map((n) => ({
    id: n.id,
    title: n.title,
    body: n.body ?? '',
    time: n.time_ago ?? timeAgo(n.created_at),
    read: n.is_read,
    icon: getIcon(n.type),
    type: n.type,
  }))

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ background: 'var(--color-page)' }}>
      <PortalHeader
        projectName={project?.name ?? 'Notifications'}
        projectStatus={project?.status ?? 'in_progress'}
        clientName={clientName}
        clientInitials={clientInitials}
        notifications={bellNotifications}
        onMarkAllRead={() => markAllAsRead()}
        onGoToSettings={() => router.push(`/portal/${projectId}`)}
        onSignOut={() => void handleSignOut()}
        projectId={projectId}
        onNotificationClick={(n) => {
          const full = notifications.find((item) => item.id === n.id)
          if (full) handleNotificationClick(full)
        }}
      />

      <div className="max-w-[720px] mx-auto px-4 sm:px-6 py-5 sm:py-8">
        <div className="flex items-center gap-2 sm:gap-3 mb-6">
          <button
            type="button"
            onClick={() => router.push(`/portal/${projectId}`)}
            className="flex items-center gap-1.5 text-[13px] font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            <ChevronLeft size={15} />
            Back
          </button>
          <h1
            className="text-[18px] sm:text-[22px] font-bold min-w-0 truncate"
            style={{
              color: 'var(--color-text-heading)',
              letterSpacing: '-0.02em',
            }}
          >
            Notifications
          </h1>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="ml-auto text-[13px] font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-accent)' }}
            >
              Mark all read
            </button>
          )}
        </div>

        <div
          className="flex items-center gap-0 mb-5 border-b overflow-x-auto"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              className="relative h-[40px] px-3 sm:px-4 text-[13px] font-medium transition-colors shrink-0 whitespace-nowrap"
              style={{
                color:
                  activeFilter === tab.id
                    ? 'var(--color-accent)'
                    : 'var(--color-text-secondary)',
              }}
            >
              {tab.label}
              {tab.id === 'unread' && unreadCount > 0 && (
                <span
                  className="ml-1.5 text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
                  style={{ background: 'var(--color-danger)' }}
                >
                  {unreadCount}
                </span>
              )}
              {activeFilter === tab.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                  style={{ background: 'var(--color-accent)' }}
                />
              )}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <span className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'var(--color-surface-hover)' }}
            >
              <Bell size={24} style={{ color: 'var(--color-text-muted)' }} />
            </div>
            <p
              className="text-[15px] font-semibold mb-1"
              style={{ color: 'var(--color-text-body)' }}
            >
              You&apos;re all caught up
            </p>
            <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
              No {activeFilter === 'all' ? '' : activeFilter} notifications yet
            </p>
          </div>
        ) : (
          <div
            className="rounded-xl border overflow-hidden"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
            }}
          >
            {filtered.map((n, i) => (
              <button
                key={n.id}
                type="button"
                onClick={() => handleNotificationClick(n)}
                className="w-full flex items-start gap-3 px-4 sm:px-5 py-4 text-left transition-colors hover:bg-[var(--color-surface-hover)]"
                style={{
                  borderBottom:
                    i < filtered.length - 1
                      ? '1px solid var(--color-border)'
                      : undefined,
                  background: n.is_read ? 'transparent' : '#FEF9F6',
                  borderLeft: n.is_read
                    ? 'none'
                    : '3px solid var(--color-accent)',
                }}
              >
                <div
                  className="w-9 h-9 rounded-xl flex items-center justify-center text-[18px] shrink-0"
                  style={{ background: 'var(--color-surface-hover)' }}
                >
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <p
                    className="text-[14px] font-semibold leading-tight mb-0.5"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {n.title}
                  </p>
                  {n.body && (
                    <p
                      className="text-[13px] leading-relaxed"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {n.body}
                    </p>
                  )}
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span
                    className="text-[11px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {n.time_ago ?? timeAgo(n.created_at)}
                  </span>
                  {!n.is_read && (
                    <span
                      className="w-2 h-2 rounded-full"
                      style={{ background: 'var(--color-accent)' }}
                    />
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
