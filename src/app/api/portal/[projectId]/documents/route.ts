import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getPortalDocuments,
  markDocumentViewed,
} from '@/server/client-portal/portal.server'

export async function GET(
  _req: Request,
  context: { params: Promise<{ projectId: string }> },
) {
  try {
    const { projectId } = await context.params
    const data = await getPortalDocuments(projectId)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(request: Request) {
  try {
    const { sendId } = (await request.json()) as { sendId: string }
    await markDocumentViewed(sendId)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
