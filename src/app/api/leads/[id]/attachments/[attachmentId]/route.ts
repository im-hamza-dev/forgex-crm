import { deleteLeadAttachment } from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok } from '@/lib/api/responses'

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; attachmentId: string }> },
) {
  try {
    const { id, attachmentId } = await context.params
    await deleteLeadAttachment(attachmentId, id)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
