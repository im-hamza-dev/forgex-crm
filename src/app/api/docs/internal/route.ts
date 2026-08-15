import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getInternalDocs,
  createInternalDoc,
} from '@/server/docs/docs.server'

const createSchema = z.object({
  title: z.string().min(1).optional().default('Untitled'),
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

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const data = await getInternalDocs({
      category: searchParams.get('category') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      my_only: searchParams.get('my_only') === 'true',
    })
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
    const data = await createInternalDoc(parsed.data)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
