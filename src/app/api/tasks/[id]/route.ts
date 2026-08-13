import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getTask,
  updateTask,
  deleteTask,
} from '@/server/tasks/tasks.server'

const updateSchema = z
  .object({
    title: z.string().min(1).optional(),
    description: z.string().nullable().optional(),
    project_id: z.string().uuid().nullable().optional(),
    milestone_id: z.string().uuid().nullable().optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    due_date: z.string().nullable().optional(),
    estimated_hours: z.number().nullable().optional(),
    actual_hours: z.number().nullable().optional(),
    completed_at: z.string().nullable().optional(),
    parent_task_id: z.string().uuid().nullable().optional(),
  })
  .strict()

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getTask(id)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body: unknown = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await updateTask(id, parsed.data)
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
    await deleteTask(id)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
