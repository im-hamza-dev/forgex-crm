import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getTeamMembers,
  getPendingInvites,
  getClients,
} from '@/server/team/team.server'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const view = searchParams.get('view')

    if (view === 'pending') {
      const data = await getPendingInvites()
      return ok(data)
    }

    if (view === 'clients') {
      const data = await getClients()
      return ok(data)
    }

    const data = await getTeamMembers()
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
