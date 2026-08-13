import { z } from 'zod'
import {
  deleteLead,
  getLead,
  updateLead,
} from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok, badRequest } from '@/lib/api/responses'

const updateSchema = z
  .object({
    contact_name: z.string().min(1).optional(),
    company: z.string().nullable().optional(),
    email: z.string().email().nullable().optional().or(z.literal('')),
    phone: z.string().nullable().optional(),
    linkedin_url: z.string().nullable().optional(),
    stage: z
      .enum([
        'new_lead',
        'contacted',
        'qualified',
        'proposal_sent',
        'negotiation',
        'won',
        'lost',
      ])
      .optional(),
    source: z
      .enum(['website_form', 'referral', 'cold_outreach', 'social', 'other'])
      .optional(),
    priority: z.enum(['hot', 'warm', 'cold']).optional(),
    service_interest: z
      .enum([
        'saas_mvp',
        'workflow_automation',
        'custom_crm',
        'ai_agents',
        'tech_retainer',
        'other',
      ])
      .nullable()
      .optional(),
    budget_range: z.string().nullable().optional(),
    assigned_to: z.string().uuid().nullable().optional(),
    next_follow_up: z.string().nullable().optional(),
    tags: z.array(z.string()).optional(),
    lead_score: z.number().int().min(1).max(10).nullable().optional(),
    status: z.enum(['active', 'won', 'lost', 'archived']).optional(),
  })
  .strict()

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getLead(id)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const body: unknown = await request.json()
    const parsed = updateSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const payload = {
      ...parsed.data,
      email:
        parsed.data.email === ''
          ? null
          : parsed.data.email,
    }

    const data = await updateLead(id, payload)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    await deleteLead(id)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
