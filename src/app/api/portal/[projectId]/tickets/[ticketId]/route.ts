import { z } from 'zod'
import { ok, created, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getPortalTicketMessages,
  replyToPortalTicket,
} from '@/server/client-portal/portal.server'

const replySchema = z.object({
  content: z.string(),
  attachments: z
    .array(
      z.object({
        name: z.string(),
        url: z.string(),
        size: z.number(),
        mimeType: z.string(),
      }),
    )
    .optional(),
})

export async function GET(
  _req: Request,
  context: { params: Promise<{ ticketId: string }> },
) {
  try {
    const { ticketId } = await context.params
    const data = await getPortalTicketMessages(ticketId)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ ticketId: string }> },
) {
  try {
    const { ticketId } = await context.params
    const body: unknown = await request.json()
    const parsed = replySchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    await replyToPortalTicket(
      ticketId,
      parsed.data.content,
      parsed.data.attachments,
    )
    return created({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
