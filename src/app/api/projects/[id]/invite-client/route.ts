import { z } from 'zod'
import { ok, created, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { inviteClient } from '@/server/projects/projects.server'

const inviteSchema = z.object({
  email: z.string().email(),
  full_name: z.string().min(1),
  company: z.string().optional(),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body: unknown = await request.json()
    const parsed = inviteSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await inviteClient(id, parsed.data)
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
