import { z } from 'zod'
import { ok, created, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { getProjects, createProject } from '@/server/projects/projects.server'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  service_type: z.string().optional(),
  status: z.string().optional(),
  payment_status: z.string().optional(),
  fixed_price: z.number().optional(),
  currency: z.string().optional(),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  completion_pct: z.number().min(0).max(100).optional(),
  is_client_visible: z.boolean().optional(),
  client_account_id: z.string().optional(),
  lead_id: z.string().optional(),
})

export async function GET() {
  try {
    const data = await getProjects()
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await createProject(parsed.data)
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
