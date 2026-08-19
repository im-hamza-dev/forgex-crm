import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getPortalProject,
  getPortalMilestones,
} from '@/server/client-portal/portal.server'

export async function GET(
  _req: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params
    const [project, milestones] = await Promise.all([
      getPortalProject(projectId),
      getPortalMilestones(projectId),
    ])
    return ok({ project, milestones })
  } catch (error) {
    return handleRouteError(error)
  }
}
