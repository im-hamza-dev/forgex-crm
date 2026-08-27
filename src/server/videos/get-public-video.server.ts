import { cache } from 'react'
import { createServiceClient } from '@/lib/supabase/service'
import { VIDEOS_BUCKET } from '@/constants/videos'
import type { PublicVideo } from '@/types/videos'

const SIGNED_URL_TTL_SECONDS = 60 * 60

/**
 * Resolves a public share slug to a playable video, or null.
 *
 * Runs with the service role because the `videos` table has no anon policy and
 * the bucket is private — the visitor never talks to Supabase directly. The
 * is_public / deleted_at check happens on every single load, which is what makes
 * revocation instant: flip either one and the next request gets null.
 *
 * Wrapped in React's cache() so generateMetadata and the page share one lookup
 * and one signed URL per request instead of minting two.
 */
export const getPublicVideo = cache(
  async (slug: string): Promise<PublicVideo | null> => {
    const service = createServiceClient()

    const { data, error } = await service
      .from('videos')
      .select('title, description, storage_path')
      .eq('slug', slug)
      .eq('is_public', true)
      .is('deleted_at', null)
      .maybeSingle()

    // A lookup failure is treated the same as "not found": the caller 404s and
    // the existence of the row stays hidden either way.
    if (error || !data) return null

    const { data: signed, error: signError } = await service.storage
      .from(VIDEOS_BUCKET)
      .createSignedUrl(data.storage_path, SIGNED_URL_TTL_SECONDS)

    if (signError || !signed?.signedUrl) return null

    // Only these three fields leave this function. No id, slug, storage_path,
    // created_by or bucket reference reaches the public HTML.
    return {
      title: data.title,
      description: data.description,
      signedUrl: signed.signedUrl,
    }
  },
)
