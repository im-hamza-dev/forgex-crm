export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  MEMBER: 'member',
} as const

export type TeamRole = (typeof ROLES)[keyof typeof ROLES]

export const ROLE_LABELS: Record<TeamRole, string> = {
  admin: 'Admin',
  manager: 'Manager',
  member: 'Lead Generator',
}

export const INVITE_ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'member', label: 'Lead Generator' },
]

export const ROLE_PERMISSIONS = {
  admin: {
    canViewLeads: true,
    canViewAllLeads: true,
    canViewProjects: true,
    canViewTasks: true,
    canViewBlog: true,
    canViewCalendar: true,
    canViewDocs: true,
    canViewReports: true,
    canViewTeam: true,
    canViewSettings: true,
    canInviteTeam: true,
    canInviteClient: true,
  },
  manager: {
    canViewLeads: true,
    canViewAllLeads: true,
    canViewProjects: true,
    canViewTasks: true,
    canViewBlog: true,
    canViewCalendar: true,
    canViewDocs: true,
    canViewReports: false,
    canViewTeam: false,
    canViewSettings: true,
    canInviteTeam: false,
    canInviteClient: true,
  },
  member: {
    canViewLeads: true,
    canViewAllLeads: false,
    canViewProjects: false,
    canViewTasks: true,
    canViewBlog: false,
    canViewCalendar: false,
    canViewDocs: true,
    canViewReports: false,
    canViewTeam: false,
    canViewSettings: true,
    canInviteTeam: false,
    canInviteClient: false,
  },
} as const satisfies Record<TeamRole, Record<string, boolean>>
