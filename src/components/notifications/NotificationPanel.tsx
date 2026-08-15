'use client'

import { useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { X, CheckCheck, Bell } from 'lucide-react'
import { NotificationItem } from './NotificationItem'
import { useNotifications } from '@/hooks/useNotifications'
import type { Notification } from '@/types/notifications'

const NAVIGATION_MAP: Record<string, (id: string) => string> = {
  lead: (id) => `/leads?open=${id}`,
  task: (id) => `/tasks?open=${id}`,
  project: (id) => `/projects/${id}`,
  ticket: (id) => `/projects/${id}?tab=tickets`,
  blog_post: (id) => `/blog/${id}`,
  blog_comment: (_id) => `/blog`,
  milestone: (id) => `/projects/${id}`,
  calendar: (_id) => `/content-calendar`,
  client_document: (_id) => `/docs?tab=client`,
}

function timeAgo(dateStr: string): string {
  const diff = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000)
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 172800) return 'Yesterday'
  return `${Math.floor(diff / 86400)}d ago`
}

interface NotificationPanelProps {
  onClose: () => void
}

export function NotificationPanel({ onClose }: NotificationPanelProps) {
  const router = useRouter()
  const panelRef = useRef<HTMLDivElement>(null)
  const {
    notifications,
    unreadCount,
    isLoading,
    markAsRead,
    markAllAsRead,
    dismissAll,
  } = useNotifications()

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClick)
    }, 100)
    return () => {
      clearTimeout(timer)
      document.removeEventListener('mousedown', handleClick)
    }
  }, [onClose])

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKey)
    return () => document.removeEventListener('keydown', handleKey)
  }, [onClose])

  const handleNotificationClick = (n: Notification) => {
    markAsRead(n.id)
    if (n.reference_type && n.reference_id) {
      const getRoute = NAVIGATION_MAP[n.reference_type]
      if (getRoute) {
        router.push(getRoute(n.reference_id))
        onClose()
      }
    }
  }

  const enriched = notifications.map((n) => ({
    ...n,
    time_ago: timeAgo(n.created_at),
  }))

  const unread = enriched.filter((n) => !n.is_read)
  const read = enriched.filter((n) => n.is_read)

  return (
    <div
      ref={panelRef}
      className="absolute right-0 top-[calc(100%+8px)] w-[400px] rounded-2xl border overflow-hidden z-50 flex flex-col"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
        maxHeight: '560px',
      }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <Bell size={15} style={{ color: 'var(--color-accent)' }} />
          <span
            className="text-[14px] font-semibold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white"
              style={{ background: 'var(--color-danger)' }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={() => markAllAsRead()}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
              style={{ color: 'var(--color-accent)' }}
            >
              <CheckCheck size={12} />
              Mark all read
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <span className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          </div>
        ) : enriched.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2">
            <Bell size={28} style={{ color: 'var(--color-text-muted)' }} />
            <p
              className="text-[13px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              You&apos;re all caught up
            </p>
          </div>
        ) : (
          <>
            {unread.length > 0 && (
              <div>
                <div
                  className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Unread
                </div>
                {unread.map((n, i) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    isLast={i === unread.length - 1 && read.length === 0}
                    onClick={() => handleNotificationClick(n)}
                  />
                ))}
              </div>
            )}

            {read.length > 0 && (
              <div>
                <div
                  className="px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Earlier
                </div>
                {read.map((n, i) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    isLast={i === read.length - 1}
                    onClick={() => handleNotificationClick(n)}
                  />
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {enriched.length > 0 && (
        <div
          className="px-4 py-2.5 border-t flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <button
            type="button"
            onClick={() => {
              router.push('/notifications')
              onClose()
            }}
            className="text-[12px] transition-colors hover:opacity-70"
            style={{ color: 'var(--color-accent)' }}
          >
            View all notifications
          </button>
          <button
            type="button"
            onClick={() => dismissAll()}
            className="text-[11px] transition-colors hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Clear read
          </button>
        </div>
      )}
    </div>
  )
}
