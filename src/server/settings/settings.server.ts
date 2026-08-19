'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireSession } from '@/server/shared/require-session'
import { SupabaseError, ValidationError } from '@/server/shared/errors'

export async function updateProfile(data: {
  full_name: string
  avatar_url?: string | null
}): Promise<void> {
  const { user } = await requireSession()
  const service = createServiceClient()

  const { error } = await service
    .from('profiles')
    .update({
      full_name: data.full_name.trim(),
      ...(data.avatar_url !== undefined && { avatar_url: data.avatar_url }),
      updated_at: new Date().toISOString(),
    })
    .eq('id', user.id)

  if (error) throw new SupabaseError(error.message)

  const supabase = await createClient()
  await supabase.auth.updateUser({
    data: { full_name: data.full_name.trim() },
  })
}

export async function changePassword(data: {
  currentPassword: string
  newPassword: string
}): Promise<void> {
  const { user } = await requireSession()
  const supabase = await createClient()

  if (!user.email) {
    throw new ValidationError('Account has no email address')
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: data.currentPassword,
  })

  if (signInError) {
    throw new ValidationError('Current password is incorrect')
  }

  const { error } = await supabase.auth.updateUser({
    password: data.newPassword,
  })

  if (error) throw new ValidationError(error.message)
}

export async function signOutAllSessions(): Promise<void> {
  await requireSession()
  const supabase = await createClient()
  await supabase.auth.signOut({ scope: 'global' })
}

export async function getProfile() {
  const { user } = await requireSession()
  const service = createServiceClient()

  const { data, error } = await service
    .from('profiles')
    .select('id, full_name, email, avatar_url, role')
    .eq('id', user.id)
    .single()

  if (error) throw new SupabaseError(error.message)
  return data
}
