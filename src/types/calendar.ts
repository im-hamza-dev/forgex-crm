export type CalendarEntryStatus =
  | 'idea'
  | 'draft'
  | 'in_review'
  | 'scheduled'
  | 'published'

export interface CalendarEntry {
  id: string
  title: string
  planned_date: string
  status: CalendarEntryStatus
  blog_post_id: string | null
  assigned_to: string | null
  assignee_name: string | null
}
