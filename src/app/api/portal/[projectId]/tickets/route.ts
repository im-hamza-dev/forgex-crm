import { z } from 'zod'
import { ok, created, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getPortalTickets,
  createPortalTicket,
} from '@/server/client-portal/portal.server'

const createSchema = z.object({
  subject: z.string().min(1),
  priority: z.enum(['low', 'medium', 'high']),
  description: z.string().min(1),
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
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params
    const data = await getPortalTickets(projectId)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params
    const body: unknown = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await createPortalTicket(projectId, parsed.data)
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
