import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { revokeClient, reinstateClient } from '@/server/team/team.server'

const schema = z.object({
  action: z.enum(['revoke', 'reinstate']),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body: unknown = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    if (parsed.data.action === 'revoke') {
      await revokeClient(id)
    } else {
      await reinstateClient(id)
    }
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
