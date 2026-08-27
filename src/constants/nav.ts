import {
  LayoutDashboard,
  Users,
  FolderKanban,
  CheckSquare,
  FileText,
  CalendarDays,
  BookOpen,
  Video,
  BarChart2,
  Bell,
  UserSquare,
  Settings2,
  Mail,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { ROUTES } from './routes'
import type { TeamRole } from './roles'
import { ROLE_PERMISSIONS } from './roles'

export interface NavItem {
  label: string
  href: string
  icon: LucideIcon
  badgeKey?: 'notifications'
  permission: keyof typeof ROLE_PERMISSIONS.admin
}

export interface NavGroup {
  label: string
  items: NavItem[]
}

const ALL_GROUPS: NavGroup[] = [
  {
    label: 'Workspace',
    items: [
      {
        label: 'Dashboard',
        href: ROUTES.DASHBOARD,
        icon: LayoutDashboard,
        permission: 'canViewLeads',
      },
      {
        label: 'Leads',
        href: ROUTES.LEADS,
        icon: Users,
        permission: 'canViewLeads',
      },
      {
        label: 'Projects',
        href: ROUTES.PROJECTS,
        icon: FolderKanban,
        permission: 'canViewProjects',
      },
      {
        label: 'Tasks',
        href: ROUTES.TASKS,
        icon: CheckSquare,
        permission: 'canViewTasks',
      },
    ],
  },
  {
    label: 'Content',
    items: [
      {
        label: 'Blog',
        href: ROUTES.BLOG,
        icon: FileText,
        permission: 'canViewBlog',
      },
      {
        label: 'Subscribers',
        href: ROUTES.BLOG_SUBSCRIBERS,
        icon: Mail,
        permission: 'canViewBlog',
      },
      {
        label: 'Calendar',
        href: ROUTES.CONTENT_CALENDAR,
        icon: CalendarDays,
        permission: 'canViewCalendar',
      },
      {
        label: 'Docs',
        href: ROUTES.DOCS,
        icon: BookOpen,
        permission: 'canViewDocs',
      },
      {
        label: 'Videos',
        href: ROUTES.VIDEOS,
        icon: Video,
        permission: 'canViewVideos',
      },
    ],
  },
  {
    label: 'Team & Insights',
    items: [
      {
        label: 'Reports',
        href: ROUTES.REPORTS,
        icon: BarChart2,
        permission: 'canViewReports',
      },
      {
        label: 'Notifications',
        href: ROUTES.NOTIFICATIONS,
        icon: Bell,
        badgeKey: 'notifications',
        permission: 'canViewLeads',
      },
      {
        label: 'Team',
        href: ROUTES.TEAM,
        icon: UserSquare,
        permission: 'canViewTeam',
      },
      {
        label: 'Settings',
        href: ROUTES.SETTINGS,
        icon: Settings2,
        permission: 'canViewSettings',
      },
    ],
  },
]

export function getNavForRole(role: TeamRole): NavGroup[] {
  const permissions = ROLE_PERMISSIONS[role]
  return ALL_GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => permissions[item.permission]),
  })).filter((group) => group.items.length > 0)
}
