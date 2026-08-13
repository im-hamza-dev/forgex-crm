import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getProject,
  updateProject,
  deleteProject,
} from '@/server/projects/projects.server'
import type { PaymentStatus, ProjectStatus, ServiceType } from '@/types/projects'

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  service_type: z
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
  status: z
    .enum([
      'discovery',
      'in_progress',
      'review',
      'delivered',
      'retainer',
      'on_hold',
      'cancelled',
    ])
    .optional(),
  payment_status: z
    .enum(['pending', 'partial', 'paid', 'overdue'])
    .optional(),
  fixed_price: z.number().nullable().optional(),
  currency: z.string().optional(),
  start_date: z.string().nullable().optional(),
  deadline: z.string().nullable().optional(),
  completion_pct: z.number().min(0).max(100).optional(),
  is_client_visible: z.boolean().optional(),
  client_account_id: z.string().nullable().optional(),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getProject(id)
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
    const data = await updateProject(id, {
      ...parsed.data,
      service_type: parsed.data.service_type as ServiceType | null | undefined,
      status: parsed.data.status as ProjectStatus | undefined,
      payment_status: parsed.data.payment_status as PaymentStatus | undefined,
    })
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
    await deleteProject(id)
    return ok({ success: true })
  } catch (error) {
    return handleRouteError(error)
  }
}
