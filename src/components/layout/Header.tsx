'use client'

import { Search, Bell } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'

interface HeaderProps {
  title: string
  breadcrumb?: { label: string; href?: string }[]
  userName?: string
  userAvatarUrl?: string | null
  notificationCount?: number
  onSearchClick?: () => void
  onBellClick?: () => void
  onAvatarClick?: () => void
}

export function Header({
  title,
  breadcrumb,
  userName = 'Hamza Iqbal',
  userAvatarUrl = null,
  notificationCount = 0,
  onSearchClick,
  onBellClick,
  onAvatarClick,
}: HeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center h-[56px] px-6 gap-4',
        'bg-[var(--color-surface)]',
        'border-b border-[var(--color-border)]',
        'sticky top-0 z-30',
      )}
    >
      <div className="flex-1 min-w-0">
        {breadcrumb && breadcrumb.length > 0 ? (
          <nav className="flex items-center gap-1.5 text-[13px]">
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5">
                {i > 0 && (
                  <span className="text-[var(--color-text-muted)]">/</span>
                )}
                {crumb.href ? (
                  <a
                    href={crumb.href}
                    className="transition-colors hover:opacity-70 text-[var(--color-accent)]"
                  >
                    {crumb.label}
                  </a>
                ) : (
                  <span className="text-[var(--color-text-heading)]">
                    {crumb.label}
                  </span>
                )}
              </span>
            ))}
          </nav>
        ) : (
          <h1 className="text-[22px] font-bold leading-none truncate text-[var(--color-text-heading)]">
            {title}
          </h1>
        )}
      </div>

      <button
        type="button"
        onClick={onSearchClick}
        className={cn(
          'flex items-center gap-2.5 px-3',
          'h-[36px] w-[300px] rounded-full',
          'border border-[var(--color-border)]',
          'bg-[var(--color-surface)]',
          'text-[13px] text-left',
          'transition-colors hover:border-[var(--color-border-strong)]',
          'outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
        )}
        aria-label="Open search"
      >
        <Search
          size={14}
          className="shrink-0 text-[var(--color-text-muted)]"
        />
        <span className="flex-1 text-[var(--color-text-muted)]">
          Search anything...
        </span>
        <kbd
          className={cn(
            'inline-flex items-center px-1.5 py-0.5',
            'rounded text-[10px] font-medium leading-none',
            'border border-[var(--color-border)]',
            'bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]',
          )}
        >
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onBellClick}
          className={cn(
            'relative flex items-center justify-center w-9 h-9 rounded-lg',
            'transition-colors',
            'hover:bg-[var(--color-surface-hover)]',
            'outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
          )}
          aria-label={`Notifications${notificationCount > 0 ? ` (${notificationCount} unread)` : ''}`}
        >
          <Bell
            size={19}
            strokeWidth={1.75}
            className="text-[var(--color-text-secondary)]"
          />
          {notificationCount > 0 && (
            <span
              className={cn(
                'absolute -top-0.5 -right-0.5',
                'flex items-center justify-center',
                'min-w-[16px] h-[16px] px-0.5',
                'rounded-full text-[9px] font-bold text-white leading-none',
                'bg-[var(--color-danger)]',
              )}
            >
              {notificationCount > 9 ? '9+' : notificationCount}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={onAvatarClick}
          className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-1"
          aria-label="User menu"
        >
          <Avatar name={userName} src={userAvatarUrl} size="sm" />
        </button>
      </div>
    </header>
  )
}
