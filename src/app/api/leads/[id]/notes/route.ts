import { z } from 'zod'
import { createLeadNote, getLeadNotes } from '@/server/leads/leads.server'
import { handleRouteError } from '@/server/shared/handle-route-error'
import { ok, created, badRequest } from '@/lib/api/responses'
import { createNotification } from '@/server/notifications/notifications.server'

const schema = z.object({
  content: z.string().min(1),
  note_type: z
    .enum(['note', 'meeting', 'email', 'call', 'whatsapp'])
    .optional()
    .default('note'),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getLeadNotes(id)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}

export async function POST(
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
    const data = await createLeadNote(
      id,
      parsed.data.content,
      parsed.data.note_type,
    )
    const { createServiceClient } = await import('@/lib/supabase/service')
    const service = createServiceClient()
    const { data: lead } = await service
      .from('leads')
      .select('assigned_to, contact_name')
      .eq('id', id)
      .single()

    if (lead?.assigned_to) {
      void createNotification({
        user_id: lead.assigned_to,
        type: 'lead_note_added',
        title: 'New note on your lead',
        body: `${data.author?.full_name ?? 'Someone'} added a ${parsed.data.note_type} note on ${lead.contact_name ?? 'a lead'}`,
        reference_type: 'lead',
        reference_id: id,
        actor_id: data.author_id,
        actor_name: data.author?.full_name ?? undefined,
        metadata: {
          contact_name: lead.contact_name ?? '',
          note_type: parsed.data.note_type,
        },
      })
    }
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
