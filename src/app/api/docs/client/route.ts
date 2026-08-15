import { z } from 'zod'
import { ok, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getClientDocuments,
  createClientDocument,
} from '@/server/docs/docs.server'

const createSchema = z.object({
  title: z.string().min(1),
  document_type: z.enum([
    'welcome',
    'nda',
    'thankyou',
    'recommendation',
    'proposal',
    'contract',
    'other',
  ]),
  content_type: z.enum(['editor', 'pdf']),
  body: z.record(z.unknown()).nullable().optional(),
  file_url: z.string().nullable().optional(),
  file_name: z.string().nullable().optional(),
  file_size: z.number().nullable().optional(),
  mime_type: z.string().nullable().optional(),
  excerpt: z.string().optional(),
  tags: z.array(z.string()).optional(),
})

export async function GET() {
  try {
    const data = await getClientDocuments()
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
    const data = await createClientDocument(parsed.data)
    return ok(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
