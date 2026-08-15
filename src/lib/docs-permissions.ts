import type { AuthProfile } from '@/stores/auth-store'

export function canCreateDoc(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canEditDoc(
  profile: AuthProfile | null,
  doc: { author_id: string },
): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  if (profile.role === 'manager') return doc.author_id === profile.id
  return false
}

export function canDeleteDoc(
  profile: AuthProfile | null,
  doc: { author_id: string },
): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  if (profile.role === 'manager') return doc.author_id === profile.id
  return false
}

export function canManageClientDocs(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}

export function canViewClientDocs(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}
