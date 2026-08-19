import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  toggleFileVisibility,
  deleteProjectFile,
} from '@/server/projects/projects.server'
import { createNotification } from '@/server/notifications/notifications.server'
import { createServiceClient } from '@/lib/supabase/service'

const patchSchema = z.object({
  is_client_visible: z.boolean(),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    const { id, fileId } = await context.params
    const body: unknown = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const data = await toggleFileVisibility(fileId, parsed.data.is_client_visible)

    // Notify client when file is made visible to them
    if (parsed.data.is_client_visible) {
      const service = createServiceClient()
      const { data: account } = await service
        .from('client_accounts')
        .select('auth_user_id')
        .eq('project_id', id)
        .eq('status', 'active')
        .maybeSingle()

      if (account?.auth_user_id) {
        void createNotification({
          user_id: account.auth_user_id,
          type: 'client_doc_sent',
          title: 'New file shared with you',
          body: `A new file has been shared on your project`,
          reference_type: 'client_document',
          reference_id: id,
          metadata: {},
        })
      }
    }

    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; fileId: string }> },
) {
  try {
    const { fileId } = await context.params
    await deleteProjectFile(fileId)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
