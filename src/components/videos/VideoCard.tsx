'use client'

import { useEffect, useState } from 'react'
import { Clock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { fetchClient } from '@/lib/api/fetch-client'
import { ROUTES } from '@/constants/routes'
import { buildPosterDataUri } from '@/lib/videos/poster'
import { formatDuration, formatFileSize } from '@/lib/videos/format'
import { VideoVisibilityBadge } from './VideoVisibilityBadge'
import { VideoActions } from './VideoActions'
import type { Video } from '@/types/videos'

interface VideoCardProps {
  video: Video
  onEdit: (video: Video) => void
  onToggleVisibility: (video: Video) => void
  onCopyLink: (video: Video) => void
  onDelete: (video: Video) => void
}

export function VideoCard({
  video,
  onEdit,
  onToggleVisibility,
  onCopyLink,
  onDelete,
}: VideoCardProps) {
  const poster = buildPosterDataUri(video.title, video.description)
  const [playbackUrl, setPlaybackUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetchClient<{ data: { signedUrl: string } }>(
      ROUTES.API.VIDEO_PLAYBACK_URL(video.id),
    )
      .then((res) => {
        if (!cancelled) setPlaybackUrl(res.data.signedUrl)
      })
      .catch(() => {
        // Poster stays visible if signing fails; no toast — card preview is best-effort.
      })

    return () => {
      cancelled = true
    }
  }, [video.id])

  return (
    <div
      className={cn(
        'group flex flex-col rounded-xl overflow-hidden',
        'border border-[var(--color-border)] bg-[var(--color-surface)]',
        'transition-shadow hover:shadow-[0_4px_16px_rgba(26,16,8,0.10)]',
      )}
    >
      <div className="relative w-full aspect-video bg-black">
        <video
          controls
          playsInline
          preload="metadata"
          poster={poster}
          src={playbackUrl ?? undefined}
          className="block h-full w-full bg-black object-contain"
        >
          Your browser cannot play this video.
        </video>
      </div>

      <div className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="text-[14px] font-semibold text-[var(--color-text-heading)] line-clamp-2">
            {video.title}
          </p>
          <VideoActions
            video={video}
            onEdit={onEdit}
            onToggleVisibility={onToggleVisibility}
            onCopyLink={onCopyLink}
            onDelete={onDelete}
            className="shrink-0 -mr-1"
            alwaysVisible
          />
        </div>

        {video.description && (
          <p className="text-[12px] text-[var(--color-text-muted)] line-clamp-2">
            {video.description}
          </p>
        )}

        <p className="text-[11px] font-mono text-[var(--color-accent)] truncate">
          /v/{video.slug}
        </p>

        <div className="flex items-center gap-2 mt-1">
          <VideoVisibilityBadge isPublic={video.is_public} />
          <span className="flex items-center gap-1 text-[11px] tabular-nums text-[var(--color-text-muted)]">
            <Clock size={11} />
            {formatDuration(video.duration_seconds)}
          </span>
          <span className="text-[11px] tabular-nums text-[var(--color-text-muted)]">
            {formatFileSize(video.file_size_bytes)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-2 pt-3 mt-1 border-t border-[var(--color-border)]">
          <span className="flex items-center gap-2 min-w-0">
            <Avatar
              name={video.creator_name}
              src={video.creator_avatar}
              size="xs"
            />
            <span className="text-[12px] text-[var(--color-text-secondary)] truncate">
              {video.creator_name ?? 'Unknown'}
            </span>
          </span>
          <span className="text-[11px] tabular-nums text-[var(--color-text-muted)] shrink-0">
            {video.created_at.split('T')[0]}
          </span>
        </div>
      </div>
    </div>
  )
}
