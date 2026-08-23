import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { restoreVideo } from '@/server/videos/videos.server'

export async function POST(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await restoreVideo(id)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
