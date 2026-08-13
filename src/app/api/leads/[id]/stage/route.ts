import { z } from 'zod'
import { updateLeadStage } from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok, badRequest } from '@/lib/api/responses'

const schema = z.object({
  newStage: z.enum([
    'new_lead',
    'contacted',
    'qualified',
    'proposal_sent',
    'negotiation',
    'won',
    'lost',
  ]),
  oldStage: z.enum([
    'new_lead',
    'contacted',
    'qualified',
    'proposal_sent',
    'negotiation',
    'won',
    'lost',
  ]),
})

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body: unknown = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await updateLeadStage(
      id,
      parsed.data.newStage,
      parsed.data.oldStage,
    )
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
