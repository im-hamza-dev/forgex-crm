import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { getPortalUpdates } from '@/server/client-portal/portal.server'

export async function GET(
  _req: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params
    const data = await getPortalUpdates(projectId)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
