import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  CalendarDays,
  BookOpen,
  BarChart2,
  Bell,
  UserSquare,
  Settings2,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from './routes'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badgeKey?: 'notifications'
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

export const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Dashboard',     href: ROUTES.DASHBOARD,        icon: LayoutDashboard },
      { label: 'Leads',         href: ROUTES.LEADS,            icon: Users },
      { label: 'Projects',      href: ROUTES.PROJECTS,         icon: FolderKanban },
      { label: 'Tasks',         href: ROUTES.TASKS,            icon: CheckSquare },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Blog',          href: ROUTES.BLOG,             icon: FileText },
      { label: 'Calendar',      href: ROUTES.CONTENT_CALENDAR, icon: CalendarDays },
      { label: 'Docs',          href: ROUTES.DOCS,             icon: BookOpen },
    ],
  },
  {
    label: 'Team & Insights',
    items: [
      { label: 'Reports',       href: ROUTES.REPORTS,          icon: BarChart2 },
      { label: 'Notifications', href: ROUTES.NOTIFICATIONS,    icon: Bell,       badgeKey: 'notifications' },
      { label: 'Team',          href: ROUTES.TEAM,             icon: UserSquare },
      { label: 'Settings',      href: ROUTES.SETTINGS,         icon: Settings2 },
    ],
  },
]
