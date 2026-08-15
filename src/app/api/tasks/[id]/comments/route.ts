import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getTaskComments,
  createTaskComment,
} from '@/server/tasks/tasks.server'
import { createNotificationForMany } from '@/server/notifications/notifications.server'

const createSchema = z.object({
  content: z.string().min(1),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getTaskComments(id)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body: unknown = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await createTaskComment(id, parsed.data.content)
    const { createServiceClient } = await import('@/lib/supabase/service')
    const service = createServiceClient()
    const { data: task } = await service
      .from('tasks')
      .select('assigned_to, created_by, title')
      .eq('id', id)
      .single()
    const { data: author } = await service
      .from('profiles')
      .select('full_name')
      .eq('id', data.author_id)
      .single()

    const recipients = [
      ...(task?.assigned_to ? [task.assigned_to] : []),
      ...(task?.created_by ? [task.created_by] : []),
    ].filter((uid, idx, arr) => arr.indexOf(uid) === idx)

    if (recipients.length > 0) {
      void createNotificationForMany(recipients, {
        type: 'task_comment_added',
        title: 'New comment on task',
        body: `${author?.full_name ?? 'Someone'} commented on "${task?.title ?? 'a task'}"`,
        reference_type: 'task',
        reference_id: id,
        actor_id: data.author_id,
        actor_name: author?.full_name ?? undefined,
        metadata: { task_title: task?.title ?? '' },
      })
    }
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
