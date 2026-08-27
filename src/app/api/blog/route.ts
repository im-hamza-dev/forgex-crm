import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { getBlogPosts, createBlogPost } from '@/server/blog/blog.server'

const createSchema = z.object({
  title: z.string().min(1).optional().default('Untitled'),
  slug: z.string().optional(),
  excerpt: z.string().nullable().optional(),
  body: z.record(z.unknown()).nullable().optional(),
  cover_image_url: z.string().nullable().optional(),
  category_id: z.string().uuid().nullable().optional(),
  tags: z.array(z.string()).optional(),
  status: z
    .enum(['draft', 'in_review', 'scheduled', 'published', 'archived'])
    .optional(),
  publish_date: z.string().nullable().optional(),
  seo_title: z.string().nullable().optional(),
  seo_description: z.string().nullable().optional(),
  canonical_url: z.string().nullable().optional(),
  og_image_url: z.string().nullable().optional(),
  is_featured: z.boolean().optional(),
  allow_comments: z.boolean().optional(),
  faqs: z
    .array(
      z.object({
        question: z.string().min(1),
        answer: z.string().min(1),
      }),
    )
    .nullable()
    .optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      category_id: searchParams.get('category_id') ?? undefined,
      author_id: searchParams.get('author_id') ?? undefined,
    }
    const data = await getBlogPosts(filters)
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
    const data = await createBlogPost({
      ...parsed.data,
      body: parsed.data.body as never,
    })
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
