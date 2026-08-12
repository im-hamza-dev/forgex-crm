export type BlogPostStatus =
  | 'draft'
  | 'in_review'
  | 'scheduled'
  | 'published'
  | 'archived'

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string | null
  body: string | null
  cover_image_url: string | null
  author_id: string
  author_name: string
  author_avatar: string | null
  category: string | null
  tags: string[]
  status: BlogPostStatus
  publish_date: string | null
  published_at: string | null
  seo_title: string | null
  seo_description: string | null
  reading_time_minutes: number | null
  is_featured: boolean
  allow_comments: boolean
  created_at: string
  updated_at: string
}
