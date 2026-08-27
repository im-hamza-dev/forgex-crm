import { createServiceClient } from '@/lib/supabase/service'
import { SupabaseError } from '@/server/shared/errors'

const MAX_SLUG_LENGTH = 80

function slugify(title: string): string {
  const base = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_SLUG_LENGTH)
    .replace(/-+$/g, '')

  return base || 'video'
}

/**
 * Builds a readable slug and makes it unique with -2, -3, ... suffixes.
 *
 * Readable slugs are guessable by design: anyone can try /v/quarterly-update
 * and find a video if that title exists and is public. The team weighed this
 * against unguessable tokens and accepted it, because the whole point is that
 * shared links stay short and human-readable. Revocation is the mitigation:
 * flip is_public to false and the link dies on the very next load.
 */
export async function generateUniqueSlug(title: string): Promise<string> {
  const base = slugify(title)

  // Service client on purpose: the slug column is unique across the whole table,
  // but the select policy hides soft-deleted rows. Reading as the user would
  // miss a deleted video's slug and hand back a value that then fails the unique
  // constraint — which the caller must never surface to a user. Only slugs are
  // read here, and the caller has already checked the role.
  const supabase = createServiceClient()

  // One round trip: fetch everything that could collide, then pick the first gap.
  const { data, error } = await supabase
    .from('videos')
    .select('slug')
    .like('slug', `${base}%`)

  if (error) throw new SupabaseError(error.message)

  const taken = new Set((data ?? []).map((row) => row.slug))
  if (!taken.has(base)) return base

  let suffix = 2
  while (taken.has(`${base}-${suffix}`)) suffix += 1
  return `${base}-${suffix}`
}
