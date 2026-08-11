export const ROLES = {
  ADMIN:   'admin',
  MANAGER: 'manager',
  MEMBER:  'member',
} as const

export type TeamRole = typeof ROLES[keyof typeof ROLES]

export const ROLE_LABELS: Record<TeamRole, string> = {
  admin:   'Admin',
  manager: 'Manager',
  member:  'Member',
}
