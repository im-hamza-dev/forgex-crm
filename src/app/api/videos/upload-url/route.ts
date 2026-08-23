import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { createVideoUploadTarget } from '@/server/videos/upload-target.server'

const schema = z
  .object({
    mime_type: z.string().min(1),
    size_bytes: z.number().int().positive(),
  })
  .strict()

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await createVideoUploadTarget({
      mimeType: parsed.data.mime_type,
      sizeBytes: parsed.data.size_bytes,
    })
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
