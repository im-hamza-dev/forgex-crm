import { z } from 'zod'
import { updateLeadStage } from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok, badRequest } from '@/lib/api/responses'
import { createNotification } from '@/server/notifications/notifications.server'

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
    const isTerminal = ['won', 'lost'].includes(parsed.data.newStage)
    if (isTerminal && data.assigned_to) {
      void createNotification({
        user_id: data.assigned_to,
        type: 'lead_stage_changed',
        title: `Lead marked as ${parsed.data.newStage}`,
        body: `${data.contact_name} has been moved to ${parsed.data.newStage}`,
        reference_type: 'lead',
        reference_id: id,
        metadata: {
          contact_name: data.contact_name,
          stage: parsed.data.newStage,
        },
      })
    }
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
