'use client'

import { useState } from 'react'
import { ChevronDown, Settings, LogOut } from 'lucide-react'
import { PortalNotificationsBell } from './PortalNotificationsBell'
import type { PortalNotification } from './PortalNotificationsBell'

interface PortalHeaderProps {
  projectName: string
  projectStatus: string
  clientName: string
  clientInitials: string
  notifications?: PortalNotification[]
  onMarkAllRead?: () => void
  onGoToSettings?: () => void
  onSignOut?: () => void
  projectId?: string
  onNotificationClick?: (notification: PortalNotification) => void
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  discovery: { bg: '#F5F5F5', text: '#6B6B6B' },
  in_progress: { bg: '#EEF3FA', text: '#1A3D6B' },
  review: { bg: '#FEF7E6', text: '#8B5E00' },
  delivered: { bg: '#EDF5ED', text: '#2D6A2D' },
  retainer: { bg: '#F5EDE6', text: '#9c6644' },
  on_hold: { bg: '#F5F5F5', text: '#6B6B6B' },
  cancelled: { bg: '#FDF0F0', text: '#8B1A1A' },
}

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

export function PortalHeader({
  projectName,
  projectStatus,
  clientName,
  clientInitials,
  notifications = [],
  onMarkAllRead,
  onGoToSettings,
  onSignOut,
  projectId,
  onNotificationClick,
}: PortalHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false)
  const statusStyle = STATUS_COLORS[projectStatus] ?? STATUS_COLORS.in_progress!

  return (
    <header
      className="sticky top-0 z-30 w-full"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="flex items-center justify-between gap-2 h-[56px] px-3 sm:px-6">
        <div className="flex items-center shrink-0 min-w-0 md:w-[180px]">
          <span
            className="text-[16px] sm:text-[18px] font-bold leading-none"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Forgex
          </span>
          <span
            className="hidden sm:inline text-[16px] sm:text-[18px] font-bold leading-none"
            style={{ color: 'var(--color-accent)' }}
          >
            .systems
          </span>
        </div>

        <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0 px-1">
          <span
            className="text-[12px] sm:text-[15px] font-semibold leading-tight truncate max-w-full"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {projectName}
          </span>
          <span
            className="hidden sm:inline-flex text-[11px] font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: statusStyle.bg,
              color: statusStyle.text,
            }}
          >
            {formatStatus(projectStatus)}
          </span>
        </div>

        <div className="flex items-center gap-0.5 sm:gap-2 shrink-0 md:w-[180px] justify-end">
          <PortalNotificationsBell
            notifications={notifications}
            onMarkAllRead={onMarkAllRead ?? (() => {})}
            projectId={projectId}
            onNotificationClick={onNotificationClick}
          />

          <div className="relative">
            <button
              type="button"
              onClick={() => setProfileOpen((v) => !v)}
              className="flex items-center gap-2 h-9 px-2 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                style={{ background: 'var(--color-accent)' }}
              >
                {clientInitials}
              </div>
              <span
                className="hidden sm:inline text-[14px] font-medium max-w-[80px] truncate"
                style={{ color: 'var(--color-text-body)' }}
              >
                {clientName}
              </span>
              <ChevronDown
                size={14}
                className="hidden sm:block"
                style={{ color: 'var(--color-text-muted)' }}
              />
            </button>

            {profileOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setProfileOpen(false)}
                />
                <div
                  className="absolute right-0 top-full mt-1 z-20 w-[200px] rounded-xl border py-1 shadow-lg overflow-hidden"
                  style={{
                    background: 'var(--color-surface)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      onGoToSettings?.()
                    }}
                    className="flex items-center gap-2.5 px-4 h-[36px] text-[13px] w-full text-left transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    <Settings size={14} style={{ color: 'var(--color-text-muted)' }} />
                    Profile Settings
                  </button>
                  <div
                    className="my-1 h-px mx-3"
                    style={{ background: 'var(--color-border)' }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setProfileOpen(false)
                      onSignOut?.()
                    }}
                    className="flex items-center gap-2.5 px-4 h-[36px] text-[13px] w-full text-left transition-colors hover:bg-[var(--color-danger-bg)]"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    <LogOut size={14} />
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
