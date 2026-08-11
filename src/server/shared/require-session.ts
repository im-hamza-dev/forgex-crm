import { createClient } from '@/lib/supabase/server'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'
import type { TeamRole } from '@/constants/roles'
import { UnauthorizedError, ForbiddenError } from './errors'

export type ServerSupabase = SupabaseClient<Database>

export async function getSession() {
  const supabase = await createClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) throw new UnauthorizedError()

  // profile.role will be available after migrations — typed as unknown until then
  const { data: profile } = await supabase
    .from('profiles' as never)
    .select('role, is_active, full_name, avatar_url')
    .eq('id', user.id)
    .single()

  return {
    user,
    supabase,
    role: (profile as { role?: TeamRole } | null)?.role ?? null,
    profile: profile as {
      role?: TeamRole
      is_active?: boolean
      full_name?: string
      avatar_url?: string
    } | null,
  }
}

export async function requireSession() {
  const session = await getSession()
  if (!session.role) throw new ForbiddenError('No role assigned')
  return session as typeof session & { role: TeamRole }
}

export async function requireRole(roles: TeamRole[]) {
  const session = await requireSession()
  if (!roles.includes(session.role)) {
    throw new ForbiddenError(`Required role: ${roles.join(' or ')}`)
  }
  return session
}
