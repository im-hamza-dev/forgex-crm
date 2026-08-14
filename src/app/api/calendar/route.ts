import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getCalendarEntries,
  createCalendarEntry,
} from '@/server/calendar/calendar.server'

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
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
