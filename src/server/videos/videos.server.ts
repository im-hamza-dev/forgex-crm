import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'
import { VIDEOS_BUCKET } from '@/constants/videos'
import { requireRole } from '@/server/shared/require-session'
import {
  NotFoundError,
  SupabaseError,
  ValidationError,
} from '@/server/shared/errors'
import { generateUniqueSlug } from '@/server/videos/slug.server'
import type { Video, VideoEditableFields } from '@/types/videos'

const VIDEO_SELECT = `
  id, slug, title, description, storage_path, is_public,
  duration_seconds, file_size_bytes, mime_type,
  created_by, created_at, updated_at, deleted_at
`

const VIDEO_ROLES = ['admin', 'manager'] as const
const PLAYBACK_URL_TTL_SECONDS = 60 * 60

async function enrichVideosWithProfiles(videos: Video[]): Promise<Video[]> {
  const profileIds = [
    ...new Set(videos.map((v) => v.created_by).filter(Boolean)),
  ]

  let profileMap: Record<
    string,
    { full_name: string | null; avatar_url: string | null }
  > = {}

  if (profileIds.length > 0) {
    // Service client: profiles RLS would otherwise hide rows from a plain join.
    const serviceClient = createServiceClient()
    const { data: profiles } = await serviceClient
      .from('profiles')
      .select('id, full_name, avatar_url')
      .in('id', profileIds)

    if (profiles) {
      profileMap = Object.fromEntries(
        profiles.map((p) => [
          p.id,
          { full_name: p.full_name, avatar_url: p.avatar_url },
        ]),
      )
    }
  }

  return videos.map((video) => {
    const profile = profileMap[video.created_by] ?? null
    return {
      ...video,
      created_profile: profile,
      creator_name: profile?.full_name ?? null,
      creator_avatar: profile?.avatar_url ?? null,
    }
  })
}

export async function getVideos(): Promise<Video[]> {
  await requireRole([...VIDEO_ROLES])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('videos')
    .select(VIDEO_SELECT)
    .is('deleted_at', null)
    .order('created_at', { ascending: false })

  if (error) throw new SupabaseError(error.message)
  return enrichVideosWithProfiles((data ?? []) as Video[])
}

export async function getVideo(id: string): Promise<Video> {
  await requireRole([...VIDEO_ROLES])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('videos')
    .select(VIDEO_SELECT)
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new SupabaseError(error.message)
  if (!data) throw new NotFoundError('Video not found')

  const [enriched] = await enrichVideosWithProfiles([data as Video])
  return enriched!
}

export async function createVideo(input: {
  title: string
  description?: string | null
  storage_path: string
  mime_type?: string | null
  file_size_bytes?: number | null
  duration_seconds?: number | null
  is_public?: boolean
}): Promise<Video> {
  const session = await requireRole([...VIDEO_ROLES])
  const supabase = await createClient()

  // The path must be one this user just uploaded to. Without this, a caller
  // could point a public video row at any other object in the bucket and have
  // it served through signed URLs.
  if (!input.storage_path.startsWith(`${session.user.id}/`)) {
    throw new ValidationError('Invalid upload path')
  }

  const slug = await generateUniqueSlug(input.title)

  const { data, error } = await supabase
    .from('videos')
    .insert({
      slug,
      title: input.title,
      description: input.description || null,
      storage_path: input.storage_path,
      mime_type: input.mime_type || null,
      file_size_bytes: input.file_size_bytes ?? null,
      duration_seconds: input.duration_seconds ?? null,
      is_public: input.is_public ?? true,
      created_by: session.user.id,
    })
    .select(VIDEO_SELECT)
    .single()

  if (error) throw new SupabaseError(error.message)

  const [enriched] = await enrichVideosWithProfiles([data as Video])
  return enriched!
}

/**
 * The parameter type has no `slug` or `storage_path`, which is what keeps the
 * slug frozen: a title edit can never rewrite an already-shared link.
 */
export async function updateVideo(
  id: string,
  data: VideoEditableFields,
): Promise<Video> {
  await requireRole([...VIDEO_ROLES])
  const supabase = await createClient()

  const patch: VideoEditableFields = {}
  if (data.title !== undefined) patch.title = data.title
  if (data.description !== undefined)
    patch.description = data.description || null
  if (data.is_public !== undefined) patch.is_public = data.is_public

  if (Object.keys(patch).length === 0) return getVideo(id)

  const { data: video, error } = await supabase
    .from('videos')
    .update(patch)
    .eq('id', id)
    .is('deleted_at', null)
    .select(VIDEO_SELECT)
    .maybeSingle()

  if (error) throw new SupabaseError(error.message)
  if (!video) throw new NotFoundError('Video not found')

  const [enriched] = await enrichVideosWithProfiles([video as Video])
  return enriched!
}

/** Soft delete: the row and the Storage object both stay, so this is reversible. */
export async function softDeleteVideo(id: string): Promise<void> {
  await requireRole([...VIDEO_ROLES])
  const supabase = await createClient()

  // Checked up front rather than through RETURNING: the select policy hides
  // rows with deleted_at set, so the updated row would not come back and a
  // successful delete would look like a missing one.
  const { data: existing, error: findError } = await supabase
    .from('videos')
    .select('id')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (findError) throw new SupabaseError(findError.message)
  if (!existing) throw new NotFoundError('Video not found')

  const { error } = await supabase
    .from('videos')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', id)

  if (error) throw new SupabaseError(error.message)
}

export async function restoreVideo(id: string): Promise<Video> {
  await requireRole([...VIDEO_ROLES])
  const supabase = await createClient()

  // Mirror of softDeleteVideo: the row is invisible to the select policy while
  // it is deleted, so it can't be read before the update or returned from it.
  // The update policy has no deleted_at condition, so the write itself is fine.
  const { error } = await supabase
    .from('videos')
    .update({ deleted_at: null })
    .eq('id', id)

  if (error) throw new SupabaseError(error.message)

  // Readable now that deleted_at is null. Throws NotFoundError if the id was
  // never real and the update matched nothing.
  return getVideo(id)
}

/** Short-lived signed URL for in-app preview (dashboard cards). */
export async function getVideoPlaybackUrl(id: string): Promise<string> {
  await requireRole([...VIDEO_ROLES])
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('videos')
    .select('storage_path')
    .eq('id', id)
    .is('deleted_at', null)
    .maybeSingle()

  if (error) throw new SupabaseError(error.message)
  if (!data) throw new NotFoundError('Video not found')

  const { data: signed, error: signError } = await supabase.storage
    .from(VIDEOS_BUCKET)
    .createSignedUrl(data.storage_path, PLAYBACK_URL_TTL_SECONDS)

  if (signError || !signed?.signedUrl) {
    throw new SupabaseError(signError?.message ?? 'Failed to create playback URL')
  }

  return signed.signedUrl
}
