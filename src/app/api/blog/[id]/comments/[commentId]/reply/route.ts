import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { replyToBlogComment } from '@/server/blog/blog.server'

const replySchema = z.object({
  content: z.string().trim().min(1).max(2000),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const { id: postId, commentId } = await context.params
    const body: unknown = await request.json()
    const parsed = replySchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const data = await replyToBlogComment({
      postId,
      parentCommentId: commentId,
      content: parsed.data.content,
    })

    return ok({ success: true, reply_id: data.id, data })
  } catch (error) {
    return handleRouteError(error)
  }
}
