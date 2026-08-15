import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { getTasks, createTask } from '@/server/tasks/tasks.server'
import { createNotification } from '@/server/notifications/notifications.server'
import type { TaskFilters } from '@/types/tasks'

const createSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  project_id: z.string().uuid().optional().nullable(),
  milestone_id: z.string().uuid().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
  status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
  due_date: z.string().optional().nullable(),
  estimated_hours: z.number().optional().nullable(),
  parent_task_id: z.string().uuid().optional().nullable(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const dueRaw = searchParams.get('due')
    const due: TaskFilters['due'] =
      dueRaw === 'today' || dueRaw === 'week' || dueRaw === 'overdue'
        ? dueRaw
        : undefined

    const filters: TaskFilters = {
      search: searchParams.get('search') ?? undefined,
      status: searchParams.get('status') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      project_id: searchParams.get('project_id') ?? undefined,
      assigned_to: searchParams.get('assigned_to') ?? undefined,
      due,
    }
    const data = await getTasks(filters)
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
    const data = await createTask(parsed.data)
    if (parsed.data.assigned_to) {
      void createNotification({
        user_id: parsed.data.assigned_to,
        type: 'task_assigned',
        title: 'New task assigned to you',
        body: `You have been assigned "${parsed.data.title}"`,
        reference_type: 'task',
        reference_id: data.id,
        actor_name:
          (data as { created_profile?: { full_name: string | null } | null })
            .created_profile?.full_name ?? undefined,
        actor_id: data.created_by,
        metadata: { task_title: parsed.data.title },
      })
    }
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
