import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { getBlogComments } from '@/server/blog/blog.server'

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getBlogComments(id)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
