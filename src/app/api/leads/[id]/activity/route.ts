import { getLeadActivity } from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok } from '@/lib/api/responses'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getLeadActivity(id)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
