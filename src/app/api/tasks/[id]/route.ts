import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getTask,
  updateTask,
  deleteTask,
} from '@/server/tasks/tasks.server'
import { createNotification } from '@/server/notifications/notifications.server'

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
    if (parsed.data.assigned_to) {
      void createNotification({
        user_id: parsed.data.assigned_to,
        type: 'task_assigned',
        title: 'Task assigned to you',
        body: `You have been assigned "${data.title}"`,
        reference_type: 'task',
        reference_id: id,
        actor_id: data.created_by,
        actor_name:
          (data as { created_profile?: { full_name: string | null } | null })
            .created_profile?.full_name ?? undefined,
        metadata: { task_title: data.title },
      })
    }
    if (parsed.data.status === 'done' && data.created_by) {
      void createNotification({
        user_id: data.created_by,
        type: 'task_completed',
        title: 'Task completed',
        body: `"${data.title}" has been marked as done`,
        reference_type: 'task',
        reference_id: id,
        actor_id: data.assigned_to ?? undefined,
        actor_name:
          (data as { assigned_profile?: { full_name: string | null } | null })
            .assigned_profile?.full_name ?? undefined,
        metadata: { task_title: data.title },
      })
    }
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
