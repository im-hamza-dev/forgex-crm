import { z } from 'zod'
import { assignLead } from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok, badRequest } from '@/lib/api/responses'
import { createNotification } from '@/server/notifications/notifications.server'

const schema = z.object({
  assigned_to: z.string().uuid(),
  assignee_name: z.string().min(1),
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
    const data = await assignLead(
      id,
      parsed.data.assigned_to,
      parsed.data.assignee_name,
    )
    void createNotification({
      user_id: parsed.data.assigned_to,
      type: 'lead_assigned',
      title: 'Lead assigned to you',
      body: `You have been assigned a lead: ${data.contact_name}`,
      reference_type: 'lead',
      reference_id: id,
      actor_name: undefined,
      metadata: { contact_name: data.contact_name },
    })
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
