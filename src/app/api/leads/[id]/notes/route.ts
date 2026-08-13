import { z } from 'zod'
import { createLeadNote, getLeadNotes } from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok, created, badRequest } from '@/lib/api/responses'

const schema = z.object({
  content: z.string().min(1),
  note_type: z
    .enum(['note', 'meeting', 'email', 'call', 'whatsapp'])
    .optional()
    .default('note'),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getLeadNotes(id)
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
    const data = await createLeadNote(
      id,
      parsed.data.content,
      parsed.data.note_type,
    )
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
