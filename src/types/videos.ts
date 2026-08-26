import type { Database } from './database.types'

export type Video = Database['public']['Tables']['videos']['Row'] & {
  created_profile?: { full_name: string | null; avatar_url: string | null } | null
  /** Denormalized for table/card helpers */
  creator_name?: string | null
  creator_avatar?: string | null
}

export type VideoInsert = Database['public']['Tables']['videos']['Insert']
export type VideoUpdate = Database['public']['Tables']['videos']['Update']

/** Row shape rendered in the dashboard list. */
export type VideoListItem = Pick<
  Video,
  | 'id'
  | 'slug'
  | 'title'
  | 'description'
  | 'is_public'
  | 'duration_seconds'
  | 'file_size_bytes'
  | 'created_at'
  | 'created_by'
  | 'view_count'
  | 'play_count'
> & {
  creator_name?: string | null
  creator_avatar?: string | null
}

export type VideoEventType = 'view' | 'play'

export type VideoEvent = Database['public']['Tables']['video_events']['Row']

export type VideoVisibility = 'public' | 'private'

export function visibilityOf(video: Pick<Video, 'is_public'>): VideoVisibility {
  return video.is_public ? 'public' : 'private'
}

/**
 * Everything the public /v/[slug] page is allowed to know. Deliberately has no
 * id, slug, storage_path or created_by so none of them can leak into the HTML.
 */
export type PublicVideo = {
  title: string
  description: string | null
  signedUrl: string
}

/** Fields the client may change. `slug` and `storage_path` are absent on purpose. */
export type VideoEditableFields = {
  title?: string
  description?: string | null
  is_public?: boolean
}
