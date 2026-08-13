import { createServiceClient } from '@/lib/supabase/service'
import { requireRole } from '@/server/shared/require-session'
import { ENV } from '@/constants/env'
import { ROUTES } from '@/constants/routes'
import type { TeamRole } from '@/constants/roles'

interface InviteTeamMemberParams {
  email: string
  full_name: string
  role: Exclude<TeamRole, 'admin'>
}

export async function inviteTeamMember(params: InviteTeamMemberParams) {
  await requireRole(['admin'])

  const supabase = createServiceClient()

  const { data, error } = await supabase.auth.admin.inviteUserByEmail(
    params.email,
    {
      data: {
        full_name: params.full_name,
        invited_role: params.role,
      },
      redirectTo: `${ENV.APP_URL}${ROUTES.ACCEPT_INVITE}`,
    },
  )

  if (error) throw new Error(error.message)

  return data
}
