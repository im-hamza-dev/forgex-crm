import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getVideo,
  updateVideo,
  softDeleteVideo,
} from '@/server/videos/videos.server'

// No slug or storage_path: the share link is frozen at creation.
const updateSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200).optional(),
    description: z.string().max(2000).nullable().optional(),
    is_public: z.boolean().optional(),
  })
  .strict()

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getVideo(id)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body: unknown = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await updateVideo(id, parsed.data)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    await softDeleteVideo(id)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
