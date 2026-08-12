'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ChevronLeft, ChevronRight, LogOut } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Badge } from '@/components/ui'
import { NAV_GROUPS, type NavItem } from '@/constants/nav'
import { ROUTES } from '@/constants/routes'

interface SidebarProps {
  collapsed: boolean
  onCollapsedChange: (collapsed: boolean) => void
  userName?: string
  userRole?: 'admin' | 'manager' | 'member'
  userAvatarUrl?: string | null
  notificationCount?: number
  onSignOut?: () => void
}

export function Sidebar({
  collapsed,
  onCollapsedChange,
  userName = 'Hamza Iqbal',
  userRole = 'admin',
  userAvatarUrl = null,
  notificationCount = 0,
  onSignOut,
}: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) =>
    href === ROUTES.DASHBOARD ? pathname === href : pathname.startsWith(href)

  const getBadge = (item: NavItem): number =>
    item.badgeKey === 'notifications' ? notificationCount : 0

  const roleLabel: Record<'admin' | 'manager' | 'member', string> = {
    admin: 'Admin',
    manager: 'Manager',
    member: 'Member',
  }

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 bottom-0 z-40',
        'flex flex-col',
        'bg-[var(--color-surface)]',
        'border-r border-[var(--color-border)]',
        'transition-[width] duration-200 ease-in-out overflow-hidden',
        collapsed ? 'w-[56px]' : 'w-[240px]',
      )}
    >
      <div
        className={cn(
          'flex items-center h-[56px] shrink-0 px-4',
          'border-b border-[var(--color-border)]',
          collapsed ? 'justify-center' : 'justify-between',
        )}
      >
        {!collapsed && (
          <span className="text-[15px] select-none leading-none">
            <span className="font-bold text-[var(--color-text-heading)]">Forgex </span>
            <span className="font-bold text-[var(--color-accent)]">CRM</span>
          </span>
        )}
        <button
          type="button"
          onClick={() => onCollapsedChange(!collapsed)}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg',
            'transition-colors',
            'text-[var(--color-text-muted)]',
            'hover:bg-[var(--color-surface-hover)]',
            'hover:text-[var(--color-text-body)]',
          )}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight size={15} /> : <ChevronLeft size={15} />}
        </button>
      </div>

      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-3">
        {NAV_GROUPS.map((group, gi) => (
          <div key={group.label} className={cn(gi > 0 && 'pt-3')}>
            {!collapsed && (
              <p className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-text-muted)]">
                {group.label}
              </p>
            )}
            {collapsed && gi > 0 && (
              <div className="mb-2 mx-2 h-px bg-[var(--color-border)]" />
            )}

            <div className="flex flex-col gap-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href)
                const badge = getBadge(item)
                const Icon = item.icon

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      'group relative flex items-center gap-2.5 rounded-lg',
                      'text-[13px] transition-colors duration-150 outline-none',
                      'focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
                      collapsed
                        ? 'h-[36px] w-[36px] mx-auto justify-center'
                        : 'h-[36px] px-2.5',
                      active
                        ? 'bg-[var(--color-action)]'
                        : 'hover:bg-[var(--color-surface-hover)]',
                    )}
                  >
                    <Icon
                      size={17}
                      strokeWidth={active ? 2 : 1.75}
                      className={cn(
                        'shrink-0 transition-colors',
                        active
                          ? 'text-white'
                          : 'text-[var(--color-text-muted)] group-hover:text-[var(--color-text-body)]',
                      )}
                    />

                    {!collapsed && (
                      <span
                        className={cn(
                          'flex-1 truncate transition-colors',
                          active
                            ? 'text-white font-semibold'
                            : 'text-[var(--color-text-secondary)] font-normal group-hover:text-[var(--color-text-body)]',
                        )}
                      >
                        {item.label}
                      </span>
                    )}

                    {badge > 0 && (
                      <span
                        className={cn(
                          'flex items-center justify-center rounded-full',
                          'text-[9px] font-bold text-white leading-none',
                          'bg-[var(--color-danger)]',
                          collapsed
                            ? 'absolute -top-0.5 -right-0.5 w-[14px] h-[14px]'
                            : 'w-[18px] h-[18px] shrink-0',
                        )}
                      >
                        {badge > 9 ? '9+' : badge}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      <div
        className={cn(
          'shrink-0 border-t border-[var(--color-border)]',
          collapsed ? 'p-2 flex justify-center' : 'px-3 py-3',
        )}
      >
        {collapsed ? (
          <Avatar name={userName} src={userAvatarUrl} size="sm" />
        ) : (
          <div className="flex items-center gap-2.5">
            <Avatar
              name={userName}
              src={userAvatarUrl}
              size="sm"
              className="shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold truncate leading-tight text-[var(--color-text-heading)]">
                {userName}
              </p>
              <Badge variant="accent" size="sm" className="mt-0.5">
                {roleLabel[userRole]}
              </Badge>
            </div>
            <button
              type="button"
              onClick={onSignOut}
              className={cn(
                'flex items-center justify-center w-7 h-7 rounded-lg shrink-0',
                'transition-colors text-[var(--color-text-muted)]',
                'hover:bg-[var(--color-danger-bg)]',
                'hover:text-[var(--color-danger)]',
              )}
              aria-label="Sign out"
            >
              <LogOut size={15} />
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
