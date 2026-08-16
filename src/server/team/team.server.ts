'use server'

import { createServiceClient } from '@/lib/supabase/service'
import { requireRole, requireSession } from '@/server/shared/require-session'
import {
  ForbiddenError,
  SupabaseError,
} from '@/server/shared/errors'
import type { TeamRole } from '@/constants/roles'

export interface TeamMember {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: TeamRole
  is_active: boolean
  created_at: string
  updated_at: string
  status: 'active' | 'inactive'
}

export interface PendingInvite {
  id: string
  email: string
  full_name: string | null
  role: string | null
  invited_at: string
}

type ProfileRow = {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  role: string
  is_active: boolean
  created_at: string
  updated_at: string
}

export async function getTeamMembers(): Promise<TeamMember[]> {
  await requireRole(['admin', 'manager'])
  const service = createServiceClient()

  const { data: authData } = await service.auth.admin.listUsers()
  const authMap = new Map((authData?.users ?? []).map((u) => [u.id, u]))

  const { data, error } = await service
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true })

  if (error) throw new SupabaseError(error.message)

  return ((data ?? []) as ProfileRow[])
    .filter((p) => {
      const authUser = authMap.get(p.id)
      if (!authUser) return true
      return Boolean(authUser.confirmed_at) || !authUser.invited_at
    })
    .map((p) => ({
      id: p.id,
      email: p.email,
      full_name: p.full_name,
      avatar_url: p.avatar_url,
      role: p.role as TeamRole,
      is_active: p.is_active,
      created_at: p.created_at,
      updated_at: p.updated_at,
      status: p.is_active ? 'active' : 'inactive',
    }))
}

export async function getPendingInvites(): Promise<PendingInvite[]> {
  await requireRole(['admin'])
  const service = createServiceClient()

  const { data, error } = await service.auth.admin.listUsers()
  if (error) throw new Error(error.message)

  return (data.users ?? [])
    .filter((u) => Boolean(u.invited_at) && !u.confirmed_at)
    .map((u) => {
      const metadata = u.user_metadata as Record<string, unknown> | undefined
      const fullName =
        typeof metadata?.full_name === 'string' ? metadata.full_name : null
      const role =
        typeof metadata?.invited_role === 'string' ? metadata.invited_role : null
      return {
        id: u.id,
        email: u.email ?? '',
        full_name: fullName,
        role,
        invited_at: u.invited_at ?? u.created_at,
      }
    })
}

export async function updateMemberRole(
  memberId: string,
  newRole: Exclude<TeamRole, 'admin'>,
): Promise<void> {
  await requireRole(['admin'])

  const { user } = await requireSession()
  if (user.id === memberId) {
    throw new ForbiddenError('You cannot change your own role')
  }

  const service = createServiceClient()

  const { data: target } = await service
    .from('profiles')
    .select('role')
    .eq('id', memberId)
    .single()

  if (target?.role === 'admin') {
    throw new ForbiddenError('Cannot change role of another admin')
  }

  const { error } = await service
    .from('profiles')
    .update({ role: newRole, updated_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) throw new SupabaseError(error.message)
}

export async function deactivateMember(memberId: string): Promise<void> {
  await requireRole(['admin'])

  const { user } = await requireSession()
  if (user.id === memberId) {
    throw new ForbiddenError('You cannot deactivate yourself')
  }

  const service = createServiceClient()

  const { data: target } = await service
    .from('profiles')
    .select('role')
    .eq('id', memberId)
    .single()

  if (target?.role === 'admin') {
    throw new ForbiddenError('Cannot deactivate another admin')
  }

  const { error } = await service
    .from('profiles')
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) throw new SupabaseError(error.message)

  await service.auth.admin.updateUserById(memberId, { ban_duration: '876600h' })
}

export async function reactivateMember(memberId: string): Promise<void> {
  await requireRole(['admin'])

  const service = createServiceClient()

  const { error } = await service
    .from('profiles')
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq('id', memberId)

  if (error) throw new SupabaseError(error.message)

  await service.auth.admin.updateUserById(memberId, { ban_duration: 'none' })
}

export async function cancelInvite(userId: string): Promise<void> {
  await requireRole(['admin'])
  const service = createServiceClient()
  const { error } = await service.auth.admin.deleteUser(userId)
  if (error) throw new Error(error.message)
}
