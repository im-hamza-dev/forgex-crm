import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  toggleUpdateVisibility,
  deleteProjectUpdate,
} from '@/server/projects/projects.server'

const patchSchema = z.object({
  is_client_visible: z.boolean(),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; updateId: string }> },
) {
  try {
    const { updateId } = await context.params
    const body: unknown = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await toggleUpdateVisibility(
      updateId,
      parsed.data.is_client_visible,
    )
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; updateId: string }> },
) {
  try {
    const { updateId } = await context.params
    await deleteProjectUpdate(updateId)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
