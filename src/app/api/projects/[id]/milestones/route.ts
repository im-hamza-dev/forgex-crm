import { z } from 'zod'
import { ok, created, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getMilestones,
  createMilestone,
} from '@/server/projects/projects.server'

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  due_date: z.string().optional(),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getMilestones(id)
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
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await createMilestone(id, parsed.data)
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
