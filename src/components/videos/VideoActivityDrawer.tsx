'use client'

import { formatDistanceToNow } from 'date-fns'
import { Globe, Monitor, MapPin } from 'lucide-react'
import { Drawer, Badge, EmptyState, Skeleton } from '@/components/ui'
import { useVideoEvents } from '@/hooks/useVideos'
import type { Video, VideoEvent } from '@/types/videos'

interface VideoActivityDrawerProps {
  video: Video | null
  open: boolean
  onClose: () => void
}

function locationLabel(event: VideoEvent): string {
  if (event.city && event.country) return `${event.city}, ${event.country}`
  return event.country || event.city || '—'
}

function deviceLabel(event: VideoEvent): string {
  const parts = [event.browser, event.os, event.device].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Unknown device'
}

export function VideoActivityDrawer({
  video,
  open,
  onClose,
}: VideoActivityDrawerProps) {
  const { data: events = [], isLoading, isError, error } = useVideoEvents(
    open ? (video?.id ?? null) : null,
  )

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title={video ? `Activity · ${video.title}` : 'Activity'}
      width={440}
    >
      <div className="px-5 py-4">
        {video && (
          <p className="mb-4 text-[12px] text-[var(--color-text-muted)]">
            {video.view_count} views · {video.play_count} plays
          </p>
        )}

        {isLoading && (
          <div className="flex flex-col gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} height={72} rounded="lg" />
            ))}
          </div>
        )}

        {isError && (
          <p className="text-[13px] text-[var(--color-danger)]">
            {error instanceof Error ? error.message : 'Failed to load activity'}
          </p>
        )}

        {!isLoading && !isError && events.length === 0 && (
          <EmptyState
            icon={<Globe size={22} />}
            title="No activity yet"
            description="Views and plays from the public share page will show up here."
          />
        )}

        {!isLoading && !isError && events.length > 0 && (
          <ul className="flex flex-col gap-3">
            {events.map((event) => (
              <li
                key={event.id}
                className="rounded-lg border border-[var(--color-border)] px-3.5 py-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <Badge
                    variant={event.event_type === 'play' ? 'accent' : 'muted'}
                    size="sm"
                  >
                    {event.event_type === 'play' ? 'Play' : 'View'}
                  </Badge>
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    {formatDistanceToNow(new Date(event.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                </div>

                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[var(--color-text-body)]">
                  <MapPin size={12} className="shrink-0 text-[var(--color-text-muted)]" />
                  <span className="truncate">{locationLabel(event)}</span>
                </p>
                <p className="mt-1 text-[12px] tabular-nums text-[var(--color-text-secondary)]">
                  {event.ip ?? '—'}
                </p>
                <p className="mt-1 flex items-center gap-1.5 text-[12px] text-[var(--color-text-secondary)]">
                  <Monitor size={12} className="shrink-0 text-[var(--color-text-muted)]" />
                  <span className="truncate">{deviceLabel(event)}</span>
                </p>
                {event.referrer && (
                  <p className="mt-1 truncate text-[11px] text-[var(--color-text-muted)]">
                    from {event.referrer}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </Drawer>
  )
}
