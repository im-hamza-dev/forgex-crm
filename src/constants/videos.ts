/** Private bucket. Nothing here is reachable without a freshly signed URL. */
export const VIDEOS_BUCKET = 'videos'

// These MUST stay in sync with the `videos` bucket's file_size_limit and
// allowed_mime_types in supabase/migrations/09_videos/001_videos.sql.
// The bucket is the real enforcement — these exist so the user gets a friendly
// error before Storage rejects the upload mid-flight.
export const VIDEO_MAX_BYTES = 524_288_000

export const VIDEO_ALLOWED_MIME = [
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
] as const

export type VideoMimeType = (typeof VIDEO_ALLOWED_MIME)[number]

export const VIDEO_MAX_MB = Math.round(VIDEO_MAX_BYTES / 1024 / 1024)

export function isAllowedVideoMime(mime: string): boolean {
  return (VIDEO_ALLOWED_MIME as readonly string[]).includes(mime)
}

export const VIDEO_ACCEPT_ATTR = VIDEO_ALLOWED_MIME.join(',')

/** Extension used for the Storage object name, keyed off the browser's MIME type. */
export const VIDEO_MIME_EXTENSIONS: Record<string, string> = {
  'video/mp4': 'mp4',
  'video/webm': 'webm',
  'video/quicktime': 'mov',
  'video/x-msvideo': 'avi',
}
