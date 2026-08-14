import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  moderateBlogComment,
  deleteBlogComment,
} from '@/server/blog/blog.server'

const moderateSchema = z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  rejection_reason: z.string().nullable().optional(),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const { commentId } = await context.params
    const body: unknown = await request.json()
    const parsed = moderateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await moderateBlogComment(
      commentId,
      parsed.data.status,
      parsed.data.rejection_reason,
    )
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; commentId: string }> },
) {
  try {
    const { commentId } = await context.params
    await deleteBlogComment(commentId)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
