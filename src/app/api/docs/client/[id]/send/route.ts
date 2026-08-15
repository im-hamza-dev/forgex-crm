import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { sendDocumentToClient } from '@/server/docs/docs.server'

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str,
  )
}

const schema = z.object({
  client_account_ids: z.array(z.string().uuid()).min(1),
})

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    if (!isUUID(id)) return badRequest('Invalid document ID')
    const body: unknown = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await sendDocumentToClient(id, parsed.data.client_account_ids)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
