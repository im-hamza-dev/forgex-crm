import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getBlogCategories,
  createBlogCategory,
} from '@/server/blog/blog.server'
import { z } from 'zod'
import { badRequest } from '@/lib/api/responses'

const createSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
})

export async function GET() {
  try {
    const data = await getBlogCategories()
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
    const data = await createBlogCategory(parsed.data)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
