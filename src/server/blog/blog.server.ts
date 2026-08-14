'use server'

import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { requireSession } from '@/server/shared/require-session'
import {
  ForbiddenError,
  NotFoundError,
  SupabaseError,
  ValidationError,
} from '@/server/shared/errors'
import type {
  BlogComment,
  BlogCommentStatus,
  BlogFilters,
  BlogPost,
  BlogPostStatus,
  BlogPostUpdate,
} from '@/types/blog'
import type { Json } from '@/types/database.types'

type ProfileSnippet = {
  id: string
  full_name: string | null
  avatar_url: string | null
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 80)
}

function estimateReadingTime(body: Json | null): number {
  if (!body || typeof body !== 'object') return 1
  const text = JSON.stringify(body)
  const words = text.split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

async function fetchProfiles(
  ids: string[],
): Promise<Record<string, ProfileSnippet>> {
  if (ids.length === 0) return {}
  const service = createServiceClient()
  const { data } = await service
    .from('profiles')
    .select('id, full_name, avatar_url')
    .in('id', ids)
  return Object.fromEntries((data ?? []).map((p) => [p.id, p]))
}

function enrichPost(
  row: BlogPost,
  profiles: Record<string, ProfileSnippet>,
): BlogPost {
  const author = row.author_id
    ? {
        full_name: profiles[row.author_id]?.full_name ?? null,
        avatar_url: profiles[row.author_id]?.avatar_url ?? null,
      }
    : null
  return {
    ...row,
    author,
    author_name: author?.full_name ?? 'Unknown',
    author_avatar: author?.avatar_url ?? null,
  }
}

export async function getBlogPosts(filters?: BlogFilters): Promise<BlogPost[]> {
  await requireSession()
  const supabase = await createClient()

  let query = supabase
    .from('blog_posts')
    .select(
      `
      *,
      category:blog_categories(id, name, slug)
    `,
    )
    .order('updated_at', { ascending: false })

  if (filters?.status && filters.status !== 'all') {
    query = query.eq('status', filters.status as BlogPostStatus)
  }
  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id)
  }
  if (filters?.author_id) {
    query = query.eq('author_id', filters.author_id)
  }
  if (filters?.search) {
    query = query.or(
      `title.ilike.%${filters.search}%,excerpt.ilike.%${filters.search}%`,
    )
  }

  const { data, error } = await query
  if (error) throw new SupabaseError(error.message)

  const rows = (data ?? []) as unknown as BlogPost[]
  const profileIds = [
    ...new Set(rows.map((p) => p.author_id).filter(Boolean)),
  ]
  const profiles = await fetchProfiles(profileIds)
  return rows.map((r) => enrichPost(r, profiles))
}

export async function getBlogPost(id: string): Promise<BlogPost> {
  await requireSession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_posts')
    .select(
      `
      *,
      category:blog_categories(id, name, slug)
    `,
    )
    .eq('id', id)
    .single()

  if (error) {
    if (error.code === 'PGRST116') throw new NotFoundError('Post not found')
    throw new SupabaseError(error.message)
  }

  const row = data as unknown as BlogPost
  const profiles = await fetchProfiles([row.author_id])
  return enrichPost(row, profiles)
}

export async function createBlogPost(input: {
  title: string
  slug?: string
  excerpt?: string | null
  body?: Json | null
  cover_image_url?: string | null
  category_id?: string | null
  tags?: string[]
  status?: BlogPostStatus
  publish_date?: string | null
  seo_title?: string | null
  seo_description?: string | null
  canonical_url?: string | null
  og_image_url?: string | null
  is_featured?: boolean
  allow_comments?: boolean
}) {
  const session = await requireSession()
  const supabase = await createClient()

  const status = input.status ?? 'draft'
  if (
    session.role === 'member' &&
    status !== 'draft'
  ) {
    throw new ForbiddenError('Members can only create draft posts')
  }

  const title = input.title.trim() || 'Untitled'
  let slug = slugify(input.slug || title) || `post-${Date.now()}`

  // Ensure unique slug
  const { data: existing } = await supabase
    .from('blog_posts')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  if (existing) slug = `${slug}-${Date.now().toString(36)}`

  const body = input.body ?? null
  const { data, error } = await supabase
    .from('blog_posts')
    .insert({
      title,
      slug,
      excerpt: input.excerpt ?? null,
      body,
      cover_image_url: input.cover_image_url ?? null,
      author_id: session.user.id,
      category_id: input.category_id ?? null,
      tags: input.tags ?? [],
      status,
      publish_date: input.publish_date ?? null,
      seo_title: input.seo_title ?? null,
      seo_description: input.seo_description ?? null,
      canonical_url: input.canonical_url ?? null,
      og_image_url: input.og_image_url ?? null,
      reading_time_minutes: estimateReadingTime(body),
      is_featured:
        session.role === 'admin' ? (input.is_featured ?? false) : false,
      allow_comments: input.allow_comments ?? true,
    })
    .select(
      `
      *,
      category:blog_categories(id, name, slug)
    `,
    )
    .single()

  if (error) throw new SupabaseError(error.message)
  const row = data as unknown as BlogPost
  const profiles = await fetchProfiles([row.author_id])
  return enrichPost(row, profiles)
}

export async function updateBlogPost(id: string, input: Partial<BlogPostUpdate>) {
  const session = await requireSession()
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('blog_posts')
    .select('id, author_id, status')
    .eq('id', id)
    .single()

  if (fetchError || !existing) throw new NotFoundError('Post not found')

  const canEdit =
    (session.role === 'admin' || session.role === 'manager') &&
    existing.author_id === session.user.id

  if (!canEdit) {
    throw new ForbiddenError('Cannot edit this post')
  }

  if (session.role === 'member') {
    if (input.status && input.status !== 'draft') {
      throw new ForbiddenError('Members can only keep posts as draft')
    }
    if (input.is_featured) {
      throw new ForbiddenError('Members cannot feature posts')
    }
  }

  if (input.is_featured && session.role !== 'admin') {
    throw new ForbiddenError('Only admins can feature posts')
  }

  const updatePayload: BlogPostUpdate = {
    ...input,
    updated_at: new Date().toISOString(),
  }

  if (input.title && !input.slug) {
    // keep existing slug unless explicitly changed
  }

  if (input.body !== undefined) {
    updatePayload.reading_time_minutes = estimateReadingTime(
      (input.body as Json) ?? null,
    )
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .update(updatePayload)
    .eq('id', id)
    .select(
      `
      *,
      category:blog_categories(id, name, slug)
    `,
    )
    .single()

  if (error) throw new SupabaseError(error.message)
  const row = data as unknown as BlogPost
  const profiles = await fetchProfiles([row.author_id])
  return enrichPost(row, profiles)
}

export async function deleteBlogPost(id: string) {
  const session = await requireSession()
  if (session.role !== 'admin') {
    throw new ForbiddenError('Only admins can delete posts')
  }
  const supabase = await createClient()
  const { error } = await supabase.from('blog_posts').delete().eq('id', id)
  if (error) throw new SupabaseError(error.message)
}

export async function getBlogCategories() {
  await requireSession()
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_categories')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw new SupabaseError(error.message)
  return data ?? []
}

export async function createBlogCategory(input: {
  name: string
  description?: string
}) {
  const session = await requireSession()
  if (session.role !== 'admin') {
    throw new ForbiddenError('Only admins can create categories')
  }
  const name = input.name.trim()
  if (!name) throw new ValidationError('Category name is required')

  const slug = slugify(name) || `category-${Date.now()}`
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_categories')
    .insert({
      name,
      slug,
      description: input.description ?? null,
    })
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return data
}

export async function getBlogComments(postId: string): Promise<BlogComment[]> {
  await requireSession()
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('blog_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)

  const teamIds = [
    ...new Set(
      (data ?? [])
        .map((c) => c.team_user_id)
        .filter((id): id is string => Boolean(id)),
    ),
  ]
  const profiles = await fetchProfiles(teamIds)

  return (data ?? []).map((c) => ({
    ...c,
    author: c.team_user_id
      ? {
          full_name: profiles[c.team_user_id]?.full_name ?? null,
          avatar_url: profiles[c.team_user_id]?.avatar_url ?? null,
        }
      : { full_name: 'Community', avatar_url: null },
  }))
}

export async function moderateBlogComment(
  commentId: string,
  status: BlogCommentStatus,
  rejectionReason?: string | null,
) {
  const session = await requireSession()
  if (session.role !== 'admin' && session.role !== 'manager') {
    throw new ForbiddenError('Cannot moderate comments')
  }

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blog_comments')
    .update({
      status,
      reviewed_by: session.user.id,
      reviewed_at: new Date().toISOString(),
      rejection_reason:
        status === 'rejected' ? (rejectionReason ?? null) : null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', commentId)
    .select()
    .single()

  if (error) throw new SupabaseError(error.message)
  return data
}

export async function deleteBlogComment(commentId: string) {
  const session = await requireSession()
  if (session.role !== 'admin') {
    throw new ForbiddenError('Only admins can delete comments')
  }
  const supabase = await createClient()
  const { error } = await supabase
    .from('blog_comments')
    .delete()
    .eq('id', commentId)
  if (error) throw new SupabaseError(error.message)
}
