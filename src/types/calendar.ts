export type CalendarEntryStatus =
  | 'idea'
  | 'draft'
  | 'in_review'
  | 'scheduled'
  | 'published'

export type CalendarEntryType =
  | 'content'
  | 'meeting'
  | 'deadline'
  | 'followup'
  | 'task'
  | 'other'

export interface CalendarEntry {
  id: string
  title: string
  planned_date: string
  status: CalendarEntryStatus
  blog_post_id: string | null
  assigned_to: string | null
  notes: string | null
  created_by: string | null
  created_at: string
  updated_at: string
  entry_type: CalendarEntryType
  scheduled_time: string | null
  is_all_day: boolean
  color: string | null
  description: string | null
  source_type: string | null
  source_id: string | null
  is_system?: boolean
  assignee_name?: string | null
  assignee_avatar?: string | null
  creator_name?: string | null
}

export type CalendarEntryInsert = {
  title: string
  planned_date: string
  entry_type: CalendarEntryType
  status?: CalendarEntryStatus
  blog_post_id?: string | null
  assigned_to?: string | null
  notes?: string | null
  scheduled_time?: string | null
  is_all_day?: boolean
  color?: string | null
  description?: string | null
  source_type?: string | null
  source_id?: string | null
}

export type CalendarFilters = {
  year: number
  month: number
}

export const ENTRY_TYPE_CONFIG: Record<
  CalendarEntryType,
  {
    label: string
    bg: string
    text: string
    dot: string
  }
> = {
  content: { label: 'Content', bg: '#F5EDE6', text: '#9c6644', dot: '#9c6644' },
  meeting: { label: 'Meeting', bg: '#E6F1FB', text: '#185FA5', dot: '#185FA5' },
  deadline: { label: 'Deadline', bg: '#FDF0F0', text: '#8B1A1A', dot: '#8B1A1A' },
  followup: { label: 'Follow-up', bg: '#FEF7E6', text: '#8B5E00', dot: '#8B5E00' },
  task: { label: 'Task', bg: '#EEEDFE', text: '#534AB7', dot: '#534AB7' },
  other: { label: 'Other', bg: '#F1EFE8', text: '#5F5E5A', dot: '#5F5E5A' },
}
