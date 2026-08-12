'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Search,
  Users,
  CheckSquare,
  FolderKanban,
  LayoutDashboard,
  Settings2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'

interface CommandItem {
  label: string
  icon: LucideIcon
  action: () => void
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

const RECENT_PAGES = [
  { label: 'Dashboard', href: ROUTES.DASHBOARD },
  { label: 'Leads', href: ROUTES.LEADS },
  { label: 'Projects', href: ROUTES.PROJECTS },
]

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')

  const COMMANDS: CommandItem[] = [
    {
      label: 'Create new lead',
      icon: Users,
      action: () => {
        router.push(ROUTES.LEADS)
        onClose()
      },
    },
    {
      label: 'Create new task',
      icon: CheckSquare,
      action: () => {
        router.push(ROUTES.TASKS)
        onClose()
      },
    },
    {
      label: 'Create new project',
      icon: FolderKanban,
      action: () => {
        router.push(ROUTES.PROJECTS)
        onClose()
      },
    },
    {
      label: 'Go to Dashboard',
      icon: LayoutDashboard,
      action: () => {
        router.push(ROUTES.DASHBOARD)
        onClose()
      },
    },
    {
      label: 'Go to Settings',
      icon: Settings2,
      action: () => {
        router.push(ROUTES.SETTINGS)
        onClose()
      },
    },
  ]

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  useEffect(() => {
    if (!open) setQuery('')
  }, [open])

  if (!open) return null

  const filteredCommands = query
    ? COMMANDS.filter((c) =>
        c.label.toLowerCase().includes(query.toLowerCase()),
      )
    : COMMANDS

  const filteredRecent = query
    ? RECENT_PAGES.filter((p) =>
        p.label.toLowerCase().includes(query.toLowerCase()),
      )
    : RECENT_PAGES

  return (
    <div className="fixed inset-0 z-[400] flex items-start justify-center pt-[15vh] px-4">
      <div
        className="absolute inset-0 bg-[rgba(26,16,8,0.5)]"
        onClick={onClose}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-[560px]',
          'bg-[var(--color-surface)] rounded-2xl',
          'shadow-[0_20px_60px_rgba(26,16,8,0.20)]',
          'overflow-hidden',
        )}
      >
        <div
          className="flex items-center gap-3 px-4 h-[56px] border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Search
            size={18}
            className="shrink-0"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            autoFocus
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search commands, leads, projects..."
            className="flex-1 text-[15px] bg-transparent border-none outline-none placeholder:text-[var(--color-text-muted)]"
            style={{ color: 'var(--color-text-body)' }}
          />
          <kbd
            className="px-2 py-0.5 rounded text-[11px] font-medium shrink-0"
            style={{
              background: 'var(--color-surface-hover)',
              border: '1px solid var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            ESC
          </kbd>
        </div>

        <div className="py-2 max-h-[400px] overflow-y-auto">
          {filteredRecent.length > 0 && (
            <div className="mb-1">
              <p
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Recent
              </p>
              {filteredRecent.map((page) => (
                <button
                  type="button"
                  key={page.label}
                  onClick={() => {
                    router.push(page.href)
                    onClose()
                  }}
                  className="w-full text-left px-4 h-[44px] text-[14px] transition-colors hover:bg-[var(--color-surface-hover)]"
                  style={{ color: 'var(--color-text-body)' }}
                >
                  {page.label}
                </button>
              ))}
            </div>
          )}

          {filteredCommands.length > 0 && (
            <div>
              <p
                className="px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.08em]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Commands
              </p>
              {filteredCommands.map((cmd) => {
                const Icon = cmd.icon
                return (
                  <button
                    type="button"
                    key={cmd.label}
                    onClick={cmd.action}
                    className="w-full text-left flex items-center gap-3 px-4 h-[44px] text-[14px] transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    <Icon
                      size={16}
                      className="shrink-0"
                      style={{ color: 'var(--color-accent)' }}
                    />
                    {cmd.label}
                  </button>
                )
              })}
            </div>
          )}

          {filteredRecent.length === 0 && filteredCommands.length === 0 && (
            <div className="py-10 text-center">
              <p
                className="text-[14px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                No results for &quot;{query}&quot;
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
