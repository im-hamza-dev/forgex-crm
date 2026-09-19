import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getBlogPost,
  updateBlogPost,
  deleteBlogPost,
} from '@/server/blog/blog.server'
import { uploadBlogOgImage } from '@/lib/og/uploadBlogOgImage'
import { createServiceClient } from '@/lib/supabase/service'

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)
}

const updateSchema = z
  .object({
    title: z.string().min(1).optional(),
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
    tldr: z.string().nullable().optional(),
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
  .strict()

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    if (!isUUID(id)) return badRequest('Invalid post ID')
    const data = await getBlogPost(id)
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
    if (!isUUID(id)) return badRequest('Invalid post ID')
    const body: unknown = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    // Detect title change before updating
    // Only regenerate OG image if title actually changed
    // This prevents unnecessary generation on every autosave
    let titleChanged = false
    if (parsed.data.title) {
      const supabaseService = createServiceClient()
      const { data: currentPost } = await supabaseService
        .from('blog_posts')
        .select('title')
        .eq('id', id)
        .single()

      titleChanged = Boolean(
        currentPost && currentPost.title !== parsed.data.title,
      )
    }

    const data = await updateBlogPost(id, {
      ...parsed.data,
      body: parsed.data.body as never,
    })

    // Fire and forget — same pattern as POST route
    // Failure never affects the update response
    if (titleChanged && parsed.data.title) {
      uploadBlogOgImage(id, parsed.data.title).catch((err) =>
        console.error('[OG] Title update regeneration failed:', err),
      )
    }

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
    if (!isUUID(id)) return badRequest('Invalid post ID')
    await deleteBlogPost(id)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
