import type { AuthProfile } from '@/stores/auth-store'

export type BlogPostRow = {
  author_id: string
  status?: string
}

export function canCreatePost(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return true
}

export function canEditPost(
  profile: AuthProfile | null,
  post: BlogPostRow,
): boolean {
  if (!profile) return false
  if (profile.role !== 'admin' && profile.role !== 'manager') return false
  return post.author_id === profile.id
}

export function canPublishPost(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canDeletePost(
  profile: AuthProfile | null,
  post: BlogPostRow
): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  if (profile.role === 'manager') return post.author_id === profile.id
  return false
}

export function canFeaturePost(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}

export function canModerateComments(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canManageCategories(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin'
}
