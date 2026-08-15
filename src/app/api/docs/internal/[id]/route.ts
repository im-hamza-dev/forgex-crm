import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getInternalDoc,
  updateInternalDoc,
  deleteInternalDoc,
} from '@/server/docs/docs.server'

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str,
  )
}

const updateSchema = z
  .object({
    title: z.string().min(1).optional(),
    content: z.record(z.unknown()).nullable().optional(),
    category: z
      .enum([
        'SOPs',
        'Playbooks',
        'Templates',
        'Research',
        'Meeting Notes',
        'Processes',
        'Other',
      ])
      .optional(),
    status: z.enum(['draft', 'published']).optional(),
    tags: z.array(z.string()).optional(),
    excerpt: z.string().optional(),
    is_shared: z.boolean().optional(),
  })
  .strict()

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    if (!isUUID(id)) return badRequest('Invalid doc ID')
    const data = await getInternalDoc(id)
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
    if (!isUUID(id)) return badRequest('Invalid doc ID')
    const body: unknown = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await updateInternalDoc(id, parsed.data)
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
    if (!isUUID(id)) return badRequest('Invalid doc ID')
    await deleteInternalDoc(id)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
