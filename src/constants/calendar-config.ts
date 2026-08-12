import type { CalendarEntryStatus } from '@/types/calendar'

export const CALENDAR_STATUS_CONFIG: Record<
  CalendarEntryStatus,
  {
    bg: string
    text: string
  }
> = {
  idea: { bg: '#F5F5F5', text: '#6B6B6B' },
  draft: { bg: '#F5F5F5', text: '#6B6B6B' },
  in_review: { bg: '#FEF7E6', text: '#8B5E00' },
  scheduled: { bg: '#EEF3FA', text: '#1A3D6B' },
  published: { bg: '#EDF5ED', text: '#2D6A2D' },
}
