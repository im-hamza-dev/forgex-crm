import { z } from 'zod'
import { ok, created, badRequest } from '@/lib/api/responses'
import { handleRouteError } from '@/server/shared/handle-route-error'
import {
  getProjectFiles,
  createProjectFile,
} from '@/server/projects/projects.server'

const createSchema = z.object({
  file_name: z.string().min(1),
  file_url: z.string().url(),
  file_size: z.number().int().nonnegative().optional(),
  mime_type: z.string().nullable().optional(),
  is_client_visible: z.boolean().optional(),
})

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params
    const data = await getProjectFiles(id)
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
    const parsed = createSchema.safeParse(body)
    if (!parsed.success) {
      return badRequest(parsed.error.issues[0]?.message ?? 'Invalid input')
    }
    const data = await createProjectFile(id, parsed.data)
    return created(data)
  } catch (error) {
    return handleRouteError(error)
  }
}
