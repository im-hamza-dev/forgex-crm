import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { updatePortalProfile } from '@/server/client-portal/portal.server'
import { createClient } from '@/lib/supabase/server'

const profileSchema = z.object({
  full_name: z.string().min(1).max(100),
})

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const body: unknown = await request.json()

    if (action === 'password') {
      const parsed = passwordSchema.safeParse(body)
      if (!parsed.success) {
        return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
      }
      const supabase = await createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user?.email) return badRequest('Not authenticated')

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: parsed.data.currentPassword,
      })
      if (signInError) return badRequest('Current password is incorrect')

      const { error } = await supabase.auth.updateUser({
        password: parsed.data.newPassword,
      })
      if (error) return badRequest(error.message)
      return ok({ success: true })
    }

    const parsed = profileSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    await updatePortalProfile(parsed.data)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
