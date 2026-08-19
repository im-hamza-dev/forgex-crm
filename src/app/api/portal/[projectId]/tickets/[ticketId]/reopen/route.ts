import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { reopenPortalTicket } from '@/server/client-portal/portal.server'

export async function POST(
  _req: Request,
  context: { params: Promise<{ projectId: string; ticketId: string }> },
) {
  try {
    const { ticketId } = await context.params
    await reopenPortalTicket(ticketId)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
