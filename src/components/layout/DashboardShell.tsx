'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { CommandPalette } from './CommandPalette'
import { useAuth } from '@/hooks/useAuth'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'
import type { TeamRole } from '@/constants/roles'

interface DashboardShellProps {
  title: string
  breadcrumb?: { label: string; href?: string }[]
  children: React.ReactNode
  noPadding?: boolean
  notificationCount?: number
}

export function DashboardShell({
  title,
  breadcrumb,
  children,
  noPadding = false,
  notificationCount = 0,
}: DashboardShellProps) {
  const router = useRouter()
  const { profile, isLoading, signOut } = useAuth()
  const [collapsed, setCollapsed] = useState(false)
  const [cmdOpen, setCmdOpen] = useState(false)

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCmdOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-page)' }}
      >
        <div className="w-6 h-6 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
      </div>
    )
  }

  const userName = profile?.full_name ?? profile?.email ?? 'Team member'
  const userRole = (profile?.role ?? 'member') as TeamRole
  const userAvatar = profile?.avatar_url ?? null

  return (
    <div className="min-h-screen bg-[var(--color-page)]">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        userName={userName}
        userRole={userRole}
        userAvatarUrl={userAvatar}
        notificationCount={notificationCount}
        onSignOut={signOut}
      />

      <div
        className={cn(
          'flex flex-col min-h-screen',
          'transition-[padding] duration-200 ease-in-out',
          collapsed ? 'pl-[56px]' : 'pl-[240px]',
        )}
      >
        <Header
          title={title}
          breadcrumb={breadcrumb}
          userName={userName}
          userAvatarUrl={userAvatar}
          notificationCount={notificationCount}
          onSearchClick={() => setCmdOpen(true)}
          onBellClick={() => router.push(ROUTES.NOTIFICATIONS)}
          onAvatarClick={() => router.push(ROUTES.SETTINGS)}
        />

        <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />

        <main className={cn('flex-1', !noPadding && 'p-6')}>
          {children}
        </main>
      </div>
    </div>
  )
}
