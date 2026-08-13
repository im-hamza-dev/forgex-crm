import { z } from 'zod'
import { inviteTeamMember } from '@/server/team/invite.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok, badRequest } from '@/lib/api/responses'

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
    return ok(result)
  } catch (error) {
    console.log('[inviteTeamMember] error:', error)
    return handleRouteError(error)
  }
}
