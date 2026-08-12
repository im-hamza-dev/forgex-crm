'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Sidebar } from './Sidebar'
import { Header } from './Header'
import { CommandPalette } from './CommandPalette'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

interface DashboardShellProps {
  title: string
  breadcrumb?: { label: string; href?: string }[]
  userName?: string
  userRole?: 'admin' | 'manager' | 'member'
  userAvatarUrl?: string | null
  notificationCount?: number
  children: React.ReactNode
  noPadding?: boolean
}

export function DashboardShell({
  title,
  breadcrumb,
  userName = 'Hamza Iqbal',
  userRole = 'admin',
  userAvatarUrl = null,
  notificationCount = 0,
  children,
  noPadding = false,
}: DashboardShellProps) {
  const router = useRouter()
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

  return (
    <div className="min-h-screen bg-[var(--color-page)]">
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        userName={userName}
        userRole={userRole}
        userAvatarUrl={userAvatarUrl}
        notificationCount={notificationCount}
        onSignOut={() => router.push(ROUTES.LOGIN)}
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
          userAvatarUrl={userAvatarUrl}
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
