import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { getProjectTickets } from '@/server/projects/projects.server'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getProjectTickets(id)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
