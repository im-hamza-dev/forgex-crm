import { deleteLeadNote } from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok } from '@/lib/api/responses'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; noteId: string }> },
) {
  try {
    const { id, noteId } = await context.params
    await deleteLeadNote(noteId, id)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
