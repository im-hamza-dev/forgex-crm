import type { CalendarEntry } from '@/types/calendar'

export const MOCK_ENTRIES: CalendarEntry[] = [
  {
    id: '1',
    title: 'Publish AI Agents post',
    planned_date: '2026-08-03',
    status: 'published',
    blog_post_id: '2',
    assigned_to: 'user-sa',
    assignee_name: 'Sara Ahmed',
  },
  {
    id: '2',
    title: 'Schedule CRM case study',
    planned_date: '2026-08-18',
    status: 'scheduled',
    blog_post_id: '1',
    assigned_to: 'user-hi',
    assignee_name: 'Hamza Iqbal',
  },
  {
    id: '3',
    title: 'Draft lead management article',
    planned_date: '2026-08-25',
    status: 'draft',
    blog_post_id: '3',
    assigned_to: 'user-zm',
    assignee_name: 'Zain Malik',
  },
  {
    id: '4',
    title: 'Patient booking case study',
    planned_date: '2026-09-05',
    status: 'draft',
    blog_post_id: '4',
    assigned_to: 'user-hi',
    assignee_name: 'Hamza Iqbal',
  },
]
