import { z } from 'zod'
import { ok, created, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getProjectUpdates,
  createProjectUpdate,
} from '@/server/projects/projects.server'
import {
  createNotification,
  createNotificationForMany,
} from '@/server/notifications/notifications.server'
import { createServiceClient } from '@/lib/supabase/service'

const createSchema = z.object({
  content: z.string().min(1),
  is_client_visible: z.boolean().optional(),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getProjectUpdates(id)
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

    const data = await createProjectUpdate(id, parsed.data)
    const service = createServiceClient()

    // Notify project members (team)
    const { data: members } = await service
      .from('project_members')
      .select('user_id')
      .eq('project_id', id)

    const memberIds = (members ?? []).map((m) => m.user_id)
    if (memberIds.length > 0) {
      void createNotificationForMany(memberIds, {
        type: 'project_updated',
        title: 'New project update',
        body: `${data.author?.full_name ?? 'Someone'} posted an update`,
        reference_type: 'project',
        reference_id: id,
        actor_id: data.author_id,
        actor_name: data.author?.full_name ?? undefined,
        metadata: {},
      })
    }

    // Notify client if update is client-visible
    if (parsed.data.is_client_visible) {
      const { data: account } = await service
        .from('client_accounts')
        .select('auth_user_id')
        .eq('project_id', id)
        .eq('status', 'active')
        .maybeSingle()

      if (account?.auth_user_id) {
        void createNotification({
          user_id: account.auth_user_id,
          type: 'project_updated',
          title: 'New project update',
          body: `The Forgex team posted a new project update`,
          reference_type: 'project',
          reference_id: id,
          metadata: {},
        })
      }
    }

    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
