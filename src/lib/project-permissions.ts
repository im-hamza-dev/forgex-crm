import type { AuthProfile } from '@/stores/auth-store'

export function canCreateProject(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canEditProject(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canDeleteProject(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}

export function canManageMembers(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canCreateMilestone(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canDeleteMilestone(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}

export function canToggleClientVisibility(
  profile: AuthProfile | null,
): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canDeleteUpdate(
  profile: AuthProfile | null,
  authorId: string,
): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  return profile.id === authorId
}

export function canDeleteProjectFile(
  profile: AuthProfile | null,
  uploadedBy: string,
): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  return profile.id === uploadedBy
}

export function canManageTickets(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canInviteClient(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}
