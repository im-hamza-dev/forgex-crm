export type DocCategory =
  | 'SOPs'
  | 'Templates'
  | 'Research'
  | 'Meeting Notes'
  | 'Other'

export interface Doc {
  id: string
  title: string
  content: string | null
  category: DocCategory
  is_shared: boolean
  author_id: string
  author_name: string
  author_avatar: string | null
  updated_at: string
  time_ago: string
}
