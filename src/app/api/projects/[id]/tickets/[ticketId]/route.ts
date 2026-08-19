import { z } from 'zod'
import { ok, created, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getTicketMessages,
  replyToTicket,
  updateTicketStatus,
} from '@/server/projects/projects.server'

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

const statusSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string; ticketId: string }> },
) {
  try {
    const { ticketId } = await context.params
    const data = await getTicketMessages(ticketId)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; ticketId: string }> },
) {
  try {
    const { ticketId } = await context.params
    const body: unknown = await request.json()
    const parsed = replySchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await replyToTicket(
      ticketId,
      parsed.data.content,
      parsed.data.attachments,
    )
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; ticketId: string }> },
) {
  try {
    const { ticketId } = await context.params
    const body: unknown = await request.json()
    const parsed = statusSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await updateTicketStatus(ticketId, parsed.data.status)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
