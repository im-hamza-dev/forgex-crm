'use client'

import { useEffect } from 'react'
import { ROUTES } from '@/constants/routes'
import { buildPosterDataUri } from '@/lib/videos/poster'

type PublicVideoPlayerProps = {
  slug: string
  title: string
  description: string | null
  signedUrl: string
}

function beacon(slug: string, type: 'view' | 'play') {
  const referrer =
    typeof document !== 'undefined' ? document.referrer || null : null
  void fetch(ROUTES.API.VIDEO_PUBLIC_EVENTS(slug), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, referrer }),
    keepalive: true,
  }).catch(() => {
    // Tracking must never break playback.
  })
}

const viewedSlugs = new Set<string>()

export function PublicVideoPlayer({
  slug,
  title,
  description,
  signedUrl,
}: PublicVideoPlayerProps) {
  useEffect(() => {
    // Module-level set survives React Strict Mode remounts so a single page
    // load records one view, not two.
    if (viewedSlugs.has(slug)) return
    viewedSlugs.add(slug)
    beacon(slug, 'view')
  }, [slug])

  return (
    <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-[0_16px_48px_rgba(26,16,8,0.16)]">
      <video
        controls
        playsInline
        preload="metadata"
        poster={buildPosterDataUri(title, description)}
        src={signedUrl}
        className="block aspect-video w-full bg-black"
        onPlay={() => beacon(slug, 'play')}
      >
        Your browser cannot play this video.
      </video>
    </div>
  )
}
