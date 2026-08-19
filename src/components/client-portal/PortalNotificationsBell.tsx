'use client'

import { useState, useEffect, useRef } from 'react'
import { Bell, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

export interface PortalNotification {
  id: string
  title: string
  body: string
  time: string
  read: boolean
  icon: string
  type?: string
}

interface PortalNotificationsBellProps {
  notifications: PortalNotification[]
  onMarkAllRead: () => void
  projectId?: string
  onNotificationClick?: (notification: PortalNotification) => void
}

export function PortalNotificationsBell({
  notifications,
  onMarkAllRead,
  projectId,
  onNotificationClick,
}: PortalNotificationsBellProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const router = useRouter()
  const unread = notifications.filter((n) => !n.read).length

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center w-9 h-9 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
        style={{ color: 'var(--color-text-secondary)' }}
      >
        <Bell size={18} strokeWidth={1.75} />
        {unread > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold text-white flex items-center justify-center leading-none"
            style={{ background: 'var(--color-danger)' }}
          >
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="absolute right-0 top-full mt-2 z-50 w-[min(360px,calc(100vw-24px))] max-w-[calc(100vw-24px)] rounded-xl border overflow-hidden"
          style={{
            background: 'var(--color-surface)',
            borderColor: 'var(--color-border)',
            boxShadow: '0 8px 32px rgba(26,16,8,0.12)',
          }}
        >
          <div
            className="flex items-center justify-between px-4 py-3 border-b"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <span
              className="text-[14px] font-semibold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Notifications
            </span>
            <div className="flex items-center gap-2">
              {unread > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  className="text-[12px] font-medium hover:opacity-70 transition-opacity"
                  style={{ color: 'var(--color-accent)' }}
                >
                  Mark all read
                </button>
              )}
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="flex items-center justify-center w-6 h-6 rounded-md hover:bg-[var(--color-surface-hover)]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={13} />
              </button>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 gap-2">
              <Bell size={24} style={{ color: 'var(--color-text-muted)' }} />
              <p
                className="text-[13px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                You&apos;re all caught up
              </p>
            </div>
          ) : (
            <div className="max-h-[360px] overflow-y-auto">
              {notifications.slice(0, 8).map((n) => (
                <button
                  key={n.id}
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onNotificationClick?.(n)
                  }}
                  className="w-full flex items-start gap-3 px-4 py-3 border-b text-left transition-colors hover:bg-[var(--color-surface-hover)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: n.read ? 'transparent' : '#FEF9F6',
                    borderLeft: n.read
                      ? 'none'
                      : '2px solid var(--color-accent)',
                  }}
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center text-[16px] shrink-0"
                    style={{ background: 'var(--color-surface-hover)' }}
                  >
                    {n.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-[13px] font-semibold leading-tight"
                      style={{ color: 'var(--color-text-heading)' }}
                    >
                      {n.title}
                    </p>
                    <p
                      className="text-[12px] mt-0.5 truncate"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {n.body}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {n.time}
                    </span>
                    {!n.read && (
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--color-accent)' }}
                      />
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}

          {notifications.length > 0 && (
            <div
              className="px-4 py-2.5 border-t text-center"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <button
                type="button"
                onClick={() => {
                  setOpen(false)
                  if (projectId) {
                    router.push(`/portal/${projectId}/notifications`)
                  }
                }}
                className="text-[13px] font-medium hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-accent)' }}
              >
                View all notifications →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
