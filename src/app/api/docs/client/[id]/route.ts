import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getClientDocument,
  updateClientDocument,
  deleteClientDocument,
} from '@/server/docs/docs.server'

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str,
  )
}

const updateSchema = z
  .object({
    title: z.string().min(1).optional(),
    document_type: z
      .enum([
        'welcome',
        'nda',
        'thankyou',
        'recommendation',
        'proposal',
        'contract',
        'other',
      ])
      .optional(),
    body: z.record(z.unknown()).nullable().optional(),
    file_url: z.string().nullable().optional(),
    file_name: z.string().nullable().optional(),
    excerpt: z.string().optional(),
    tags: z.array(z.string()).optional(),
  })
  .strict()

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    if (!isUUID(id)) return badRequest('Invalid document ID')
    const data = await getClientDocument(id)
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
    if (!isUUID(id)) return badRequest('Invalid document ID')
    const body: unknown = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await updateClientDocument(id, parsed.data)
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
    if (!isUUID(id)) return badRequest('Invalid document ID')
    await deleteClientDocument(id)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
