import { z } from 'zod'
import {
  createLeadAttachment,
  getLeadAttachments,
} from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok, created, badRequest } from '@/lib/api/responses'

const schema = z.object({
  file_name: z.string().min(1),
  file_url: z.string().url(),
  file_size: z.number().int().nonnegative(),
  mime_type: z.string().nullable().optional(),
  note_id: z.string().uuid().nullable().optional(),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getLeadAttachments(id)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
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
    const data = await createLeadAttachment(id, parsed.data)
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
