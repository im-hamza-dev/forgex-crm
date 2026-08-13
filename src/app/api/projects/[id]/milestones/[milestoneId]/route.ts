import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  completeMilestone,
  deleteMilestone,
} from '@/server/projects/projects.server'

export async function PATCH(
  _request: Request,
  context: { params: Promise<{ id: string; milestoneId: string }> },
) {
  try {
    const { milestoneId } = await context.params
    const data = await completeMilestone(milestoneId)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; milestoneId: string }> },
) {
  try {
    const { milestoneId } = await context.params
    await deleteMilestone(milestoneId)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
