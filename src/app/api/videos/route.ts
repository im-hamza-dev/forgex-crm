import { z } from 'zod'
import { ok, created, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { getVideos, createVideo } from '@/server/videos/videos.server'
import { VIDEO_ALLOWED_MIME, VIDEO_MAX_BYTES } from '@/constants/videos'

const createSchema = z
  .object({
    title: z.string().min(1, 'Title is required').max(200),
    description: z.string().max(2000).optional().nullable(),
    storage_path: z.string().min(1),
    mime_type: z.enum(VIDEO_ALLOWED_MIME).optional().nullable(),
    file_size_bytes: z.number().int().positive().max(VIDEO_MAX_BYTES).optional().nullable(),
    duration_seconds: z.number().int().nonnegative().optional().nullable(),
    is_public: z.boolean().optional(),
  })
  .strict()

export async function GET() {
  try {
    const data = await getVideos()
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await createVideo(parsed.data)
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
