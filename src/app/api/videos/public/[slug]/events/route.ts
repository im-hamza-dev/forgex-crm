import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { recordPublicVideoEvent } from '@/server/videos/events.server'

const schema = z
  .object({
    type: z.enum(['view', 'play']),
    referrer: z.string().max(2000).optional().nullable(),
  })
  .strict()

export async function POST(
  request: Request,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params
    const body: unknown = await request.json().catch(() => null)
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    await recordPublicVideoEvent(slug, parsed.data.type, parsed.data.referrer)
    return ok({ ok: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
