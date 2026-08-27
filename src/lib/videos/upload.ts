import { Upload } from 'tus-js-client'
import { createClient } from '@/lib/supabase/client'
import { fetchClient } from '@/lib/api/fetch-client'
import { ROUTES } from '@/constants/routes'
import {
  VIDEO_MAX_BYTES,
  VIDEO_MAX_MB,
  isAllowedVideoMime,
} from '@/constants/videos'

type UploadTarget = {
  endpoint: string
  bucket: string
  objectName: string
}

// Supabase's resumable endpoint rejects any other chunk size.
const CHUNK_SIZE = 6 * 1024 * 1024

export type UploadVideoArgs = {
  file: File
  onProgress?: (percent: number) => void
  signal?: AbortSignal
}

/**
 * Uploads a file to the private `videos` bucket over TUS so a dropped
 * connection resumes instead of restarting a few hundred megabytes.
 *
 * Authenticates with the user's own session token — the server hands back only
 * a path, never a credential — so the bucket's insert policy still decides
 * whether the write is allowed.
 */
export async function uploadVideoResumable({
  file,
  onProgress,
  signal,
}: UploadVideoArgs): Promise<string> {
  const mimeType = file.type || 'video/mp4'

  if (!isAllowedVideoMime(mimeType)) {
    throw new Error('Unsupported video format')
  }
  if (file.size > VIDEO_MAX_BYTES) {
    throw new Error(`Video must be ${VIDEO_MAX_MB} MB or smaller`)
  }

  const { data: target } = await fetchClient<{ data: UploadTarget }>(
    ROUTES.API.VIDEO_UPLOAD_URL,
    {
      method: 'POST',
      body: JSON.stringify({ mime_type: mimeType, size_bytes: file.size }),
    },
  )

  const supabase = createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('Your session expired. Sign in again to upload.')
  }

  return new Promise<string>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: target.endpoint,
      chunkSize: CHUNK_SIZE,
      retryDelays: [0, 3000, 6000, 12000, 24000],
      uploadDataDuringCreation: true,
      removeFingerprintOnSuccess: true,
      headers: {
        authorization: `Bearer ${session.access_token}`,
        'x-upsert': 'false',
      },
      metadata: {
        bucketName: target.bucket,
        objectName: target.objectName,
        contentType: mimeType,
        cacheControl: '3600',
      },
      onProgress: (sent, total) => {
        if (total > 0) onProgress?.(Math.round((sent / total) * 100))
      },
      onSuccess: () => resolve(target.objectName),
      onError: (error) => reject(error),
    })

    if (signal) {
      signal.addEventListener(
        'abort',
        () => {
          void upload.abort(true)
          reject(new Error('Upload cancelled'))
        },
        { once: true },
      )
    }

    upload.start()
  })
}
