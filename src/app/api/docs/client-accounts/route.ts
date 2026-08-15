import { ok } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { getClientAccounts } from '@/server/docs/docs.server'

export async function GET() {
  try {
    const data = await getClientAccounts()
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
