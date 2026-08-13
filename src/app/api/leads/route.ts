import { z } from 'zod'
import { createLead, getLeads } from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok, created, badRequest } from '@/lib/api/responses'

const createSchema = z.object({
  contact_name: z.string().min(1),
  company: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  phone: z.string().optional().nullable(),
  linkedin_url: z.string().optional().nullable(),
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
    .optional()
    .nullable(),
  budget_range: z.string().optional().nullable(),
  assigned_to: z.string().uuid().optional().nullable(),
  next_follow_up: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  lead_score: z.number().int().min(1).max(10).optional().nullable(),
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filters = {
      stage: searchParams.get('stage') ?? undefined,
      search: searchParams.get('search') ?? undefined,
      assigned_to: searchParams.get('assigned_to') ?? undefined,
      priority: searchParams.get('priority') ?? undefined,
      status: searchParams.get('status') ?? undefined,
    }
    const data = await getLeads(filters)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(request: Request) {
  try {
    const body: unknown = await request.json()
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }

    const payload = {
      ...parsed.data,
      email: parsed.data.email === '' ? null : parsed.data.email,
    }

    const data = await createLead(payload)
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
