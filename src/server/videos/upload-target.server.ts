import { randomUUID } from 'node:crypto'
import { requireRole } from '@/server/shared/require-session'
import { ValidationError } from '@/server/shared/errors'
import { ENV } from '@/constants/env'
import {
  VIDEOS_BUCKET,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_MB,
  VIDEO_MIME_EXTENSIONS,
  isAllowedVideoMime,
} from '@/constants/videos'

export type VideoUploadTarget = {
  /** TUS endpoint for Supabase resumable uploads. */
  endpoint: string
  bucket: string
  objectName: string
}

/**
 * Reserves an object path for a resumable upload.
 *
 * Nothing privileged is handed back: the browser authenticates the TUS upload
 * with its own session token, and the bucket's insert policy already restricts
 * writes to admin/manager. Re-checking the role here keeps a client that skips
 * the UI from getting a usable path.
 */
export async function createVideoUploadTarget(input: {
  mimeType: string
  sizeBytes: number
}): Promise<VideoUploadTarget> {
  const session = await requireRole(['admin', 'manager'])

  if (!isAllowedVideoMime(input.mimeType)) {
    throw new ValidationError(`Unsupported video format: ${input.mimeType}`)
  }

  if (input.sizeBytes > VIDEO_MAX_BYTES) {
    throw new ValidationError(`Video must be ${VIDEO_MAX_MB} MB or smaller`)
  }

  const extension = VIDEO_MIME_EXTENSIONS[input.mimeType] ?? 'mp4'

  return {
    endpoint: `${ENV.SUPABASE_URL}/storage/v1/upload/resumable`,
    bucket: VIDEOS_BUCKET,
    objectName: `${session.user.id}/${randomUUID()}.${extension}`,
  }
}
