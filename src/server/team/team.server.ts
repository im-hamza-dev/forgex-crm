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
      // Never show client role in team management
      if (p.role === 'client') return false
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
    .filter((u) => {
      if (!u.invited_at || u.confirmed_at) return false
      // Exclude client invites — they appear in project management, not team
      if (u.user_metadata?.invited_role === 'client') return false
      return true
    })
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

export interface ClientAccount {
  id: string
  full_name: string | null
  company: string | null
  email: string
  status: 'pending' | 'active' | 'revoked'
  project_id: string
  project_name: string | null
  created_at: string
}

function embeddedProjectName(project: unknown): string | null {
  if (!project) return null
  const row = Array.isArray(project) ? project[0] : project
  if (row && typeof row === 'object' && 'name' in row) {
    const name = (row as { name?: unknown }).name
    return typeof name === 'string' ? name : null
  }
  return null
}

export async function getClients(): Promise<ClientAccount[]> {
  await requireRole(['admin', 'manager'])
  const service = createServiceClient()

  const { data, error } = await service
    .from('client_accounts')
    .select(
      `
      id,
      full_name,
      company,
      email,
      status,
      project_id,
      created_at,
      project:projects!client_accounts_project_id_fkey(name)
    `,
    )
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)

  return (data ?? []).map((c) => ({
    id: c.id,
    full_name: c.full_name,
    company: c.company,
    email: c.email,
    status: c.status as 'pending' | 'active' | 'revoked',
    project_id: c.project_id,
    project_name: embeddedProjectName(c.project),
    created_at: c.created_at,
  }))
}

export async function revokeClient(clientAccountId: string): Promise<void> {
  await requireRole(['admin'])
  const service = createServiceClient()

  const { data: account, error: lookupError } = await service
    .from('client_accounts')
    .select('auth_user_id')
    .eq('id', clientAccountId)
    .single()

  if (lookupError) throw new SupabaseError(lookupError.message)

  const { error } = await service
    .from('client_accounts')
    .update({ status: 'revoked' })
    .eq('id', clientAccountId)

  if (error) throw new SupabaseError(error.message)

  if (account?.auth_user_id) {
    await service.auth.admin.updateUserById(account.auth_user_id, {
      ban_duration: '876600h',
    })
  }
}

export async function reinstateClient(clientAccountId: string): Promise<void> {
  await requireRole(['admin'])
  const service = createServiceClient()

  const { data: account, error: lookupError } = await service
    .from('client_accounts')
    .select('auth_user_id')
    .eq('id', clientAccountId)
    .single()

  if (lookupError) throw new SupabaseError(lookupError.message)

  const { error } = await service
    .from('client_accounts')
    .update({ status: 'active' })
    .eq('id', clientAccountId)

  if (error) throw new SupabaseError(error.message)

  if (account?.auth_user_id) {
    await service.auth.admin.updateUserById(account.auth_user_id, {
      ban_duration: 'none',
    })
  }
}
