import type { Database, Json } from './database.types'

export type BlogPostStatus = Database['public']['Enums']['blog_post_status']
export type BlogCommentStatus =
  Database['public']['Enums']['blog_comment_status']

export type BlogPost = Database['public']['Tables']['blog_posts']['Row'] & {
  author?: {
    full_name: string | null
    avatar_url: string | null
  } | null
  category?: {
    id: string
    name: string
    slug: string
  } | null
  /** Flattened helpers for UI that still expects these */
  author_name?: string
  author_avatar?: string | null
}

export type BlogPostInsert = Database['public']['Tables']['blog_posts']['Insert']
export type BlogPostUpdate = Database['public']['Tables']['blog_posts']['Update']

export type BlogCategory =
  Database['public']['Tables']['blog_categories']['Row']

export type BlogComment =
  Database['public']['Tables']['blog_comments']['Row'] & {
    author?: {
      full_name: string | null
      avatar_url: string | null
    } | null
  }

export type BlogFilters = {
  search?: string
  status?: BlogPostStatus | 'all' | string
  category_id?: string
  author_id?: string
}

export type BlogBody = Json | Record<string, unknown> | null
