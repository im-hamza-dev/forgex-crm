import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { deleteTaskComment } from '@/server/tasks/tasks.server'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const { commentId } = await context.params
    await deleteTaskComment(commentId)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
