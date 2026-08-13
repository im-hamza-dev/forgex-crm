import type { AuthProfile } from '@/stores/auth-store'

export type TaskRow = {
  assigned_to: string | null
  created_by: string
}

export function canViewAllTasks(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canCreateTask(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return true
}

export function canEditTask(
  profile: AuthProfile | null,
  task: TaskRow,
): boolean {
  if (!profile) return false
  if (profile.role === 'admin' || profile.role === 'manager') return true
  return task.assigned_to === profile.id || task.created_by === profile.id
}

export function canDeleteTask(
  profile: AuthProfile | null,
  task: TaskRow,
): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  if (profile.role === 'manager') return task.created_by === profile.id
  return false
}

export function canAssignTask(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canLinkToProject(profile: AuthProfile | null): boolean {
  if (!profile) return false
  return profile.role === 'admin' || profile.role === 'manager'
}

export function canDeleteComment(
  profile: AuthProfile | null,
  authorId: string,
): boolean {
  if (!profile) return false
  if (profile.role === 'admin') return true
  return profile.id === authorId
}
