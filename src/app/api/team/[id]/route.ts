import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  updateMemberRole,
  deactivateMember,
  reactivateMember,
  cancelInvite,
} from '@/server/team/team.server'

const updateSchema = z.object({
  action: z.enum(['update_role', 'deactivate', 'reactivate', 'cancel_invite']),
  role: z.enum(['manager', 'member']).optional(),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body: unknown = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const { action, role } = parsed.data

    if (action === 'update_role') {
      if (!role) return badRequest('Role is required')
      await updateMemberRole(id, role)
    } else if (action === 'deactivate') {
      await deactivateMember(id)
    } else if (action === 'reactivate') {
      await reactivateMember(id)
    } else if (action === 'cancel_invite') {
      await cancelInvite(id)
    }

    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
