import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  updateCalendarEntry,
  deleteCalendarEntry,
} from '@/server/calendar/calendar.server'

function isUUID(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    str,
  )
}

const updateSchema = z
  .object({
    title: z.string().min(1).optional(),
    planned_date: z.string().optional(),
    entry_type: z
      .enum(['content', 'meeting', 'deadline', 'followup', 'task', 'other'])
      .optional(),
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
  .strict()

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    if (!isUUID(id)) return badRequest('Invalid entry ID')
    const body: unknown = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await updateCalendarEntry(id, parsed.data)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    if (!isUUID(id)) return badRequest('Invalid entry ID')
    await deleteCalendarEntry(id)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
