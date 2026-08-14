import type { AuthProfile } from '@/stores/auth-store'

export function canEditCalendarEntry(
  profile: AuthProfile | null,
  entry: { created_by: string | null; assigned_to: string | null },
): boolean {
  if (!profile) return false
  if (!entry.created_by) return false
  if (profile.role === 'admin') return true
  return (
    entry.created_by === profile.id || entry.assigned_to === profile.id
  )
}

export function canDeleteCalendarEntry(
  profile: AuthProfile | null,
  entry: { created_by: string | null },
): boolean {
  if (!profile) return false
  if (!entry.created_by) return false
  if (profile.role === 'admin') return true
  return entry.created_by === profile.id
}

export function canAssignCalendarEntry(
  profile: AuthProfile | null,
): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}
