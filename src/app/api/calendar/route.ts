import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getCalendarEntries,
  createCalendarEntry,
} from '@/server/calendar/calendar.server'
import { createNotification } from '@/server/notifications/notifications.server'

const createSchema = z.object({
  title: z.string().min(1),
  planned_date: z.string(),
  entry_type: z.enum([
    'content',
    'meeting',
    'deadline',
    'followup',
    'task',
    'other',
  ]),
  status: z
    .enum(['idea', 'draft', 'in_review', 'scheduled', 'published'])
    .optional(),
  blog_post_id: z.string().uuid().nullable().optional(),
  assigned_to: z.string().uuid().nullable().optional(),
  notes: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  scheduled_time: z.string().nullable().optional(),
  is_all_day: z.boolean().optional(),
  color: z.string().nullable().optional(),
  source_type: z.string().nullable().optional(),
  source_id: z.string().uuid().nullable().optional(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const year = parseInt(
      searchParams.get('year') ?? String(new Date().getFullYear()),
      10,
    )
    const month = parseInt(
      searchParams.get('month') ?? String(new Date().getMonth()),
      10,
    )
    const data = await getCalendarEntries(year, month)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await createCalendarEntry(parsed.data)
    if (parsed.data.assigned_to && !parsed.data.source_type) {
      void createNotification({
        user_id: parsed.data.assigned_to,
        type: 'calendar_assigned',
        title: 'Calendar entry assigned to you',
        body: `"${parsed.data.title}" has been assigned to you on ${parsed.data.planned_date}`,
        reference_type: 'calendar',
        reference_id: data.id,
        metadata: {
          entry_title: parsed.data.title,
          planned_date: parsed.data.planned_date,
          entry_type: parsed.data.entry_type,
        },
      })
    }
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
