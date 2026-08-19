import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { updateProfile } from '@/server/settings/settings.server'

const schema = z.object({
  full_name: z.string().min(1).max(100),
  avatar_url: z.string().url().nullable().optional(),
})

export async function PATCH(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    await updateProfile(parsed.data)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
