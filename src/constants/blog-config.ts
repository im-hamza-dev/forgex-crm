import type { BlogPostStatus } from '@/types/blog'

export type BlogStatusFilter =
  | 'all'
  | 'draft'
  | 'in_review'
  | 'scheduled'
  | 'published'
  | 'archived'

export interface BlogStatusConfig {
  value: BlogPostStatus | 'all'
  label: string
  badgeBg: string
  badgeText: string
}

export const BLOG_STATUS_CONFIG: Record<
  string,
  {
    label: string
    badgeBg: string
    badgeText: string
  }
> = {
  draft: { label: 'Draft', badgeBg: '#F5F5F5', badgeText: '#6B6B6B' },
  in_review: { label: 'In Review', badgeBg: '#FEF7E6', badgeText: '#8B5E00' },
  scheduled: { label: 'Scheduled', badgeBg: '#EEF3FA', badgeText: '#1A3D6B' },
  published: { label: 'Published', badgeBg: '#EDF5ED', badgeText: '#2D6A2D' },
  archived: { label: 'Archived', badgeBg: '#F5F5F5', badgeText: '#9CA3AF' },
}

export const BLOG_CATEGORIES = [
  'AI & Automation',
  'SaaS Development',
  'CRM & Sales',
  'Case Study',
  'Engineering',
  'Business',
]

export const BLOG_FILTER_TABS: { value: BlogStatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
]
