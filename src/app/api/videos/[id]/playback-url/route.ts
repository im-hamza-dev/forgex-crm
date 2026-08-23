import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { getVideoPlaybackUrl } from '@/server/videos/videos.server'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const signedUrl = await getVideoPlaybackUrl(id)
    return ok({ signedUrl })
  } catch (error) {
    return handleRouteError(error)
  }
}
