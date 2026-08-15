import { z } from 'zod'
import { inviteTeamMember } from '@/server/team/invite.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok, badRequest } from '@/lib/api/responses'
import { createNotificationForMany } from '@/server/notifications/notifications.server'

const schema = z.object({
  email: z.string().email(),
  full_name: z.string().min(2),
  role: z.enum(['manager', 'member']),
})

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const result = await inviteTeamMember(parsed.data)
    const { createServiceClient } = await import('@/lib/supabase/service')
    const service = createServiceClient()
    const { data: admins } = await service
      .from('profiles')
      .select('id')
      .eq('role', 'admin')
      .eq('is_active', true)

    const adminIds = (admins ?? []).map((a) => a.id)

    if (adminIds.length > 0) {
      void createNotificationForMany(adminIds, {
        type: 'client_invited',
        title: 'New team member invited',
        body: `${parsed.data.full_name} (${parsed.data.email}) was invited as ${parsed.data.role}`,
        metadata: {
          full_name: parsed.data.full_name,
          email: parsed.data.email,
          role: parsed.data.role,
        },
      })
    }
    return ok(result)
  } catch (error) {
    console.log('[inviteTeamMember] error:', error)
    return handleRouteError(error)
  }
}
