'use client'

import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { formatDuration, formatFileSize } from '@/lib/videos/format'
import { VideoVisibilityBadge } from './VideoVisibilityBadge'
import { VideoActions } from './VideoActions'
import type { Video } from '@/types/videos'

interface VideosTableProps {
  videos: Video[]
  searchQuery: string
  onSearchChange: (q: string) => void
  onEdit: (video: Video) => void
  onToggleVisibility: (video: Video) => void
  onCopyLink: (video: Video) => void
  onDelete: (video: Video) => void
}

const COLUMNS = [
  { label: 'Title', cls: 'text-left pl-4' },
  { label: 'Visibility', cls: 'text-left w-[110px]' },
  { label: 'Duration', cls: 'text-left w-[100px]' },
  { label: 'Size', cls: 'text-left w-[100px]' },
  { label: 'Created By', cls: 'text-left w-[150px]' },
  { label: 'Created', cls: 'text-left w-[110px]' },
  { label: '', cls: 'w-10 pr-4' },
]

export function VideosTable({
  videos,
  searchQuery,
  onSearchChange,
  onEdit,
  onToggleVisibility,
  onCopyLink,
  onDelete,
}: VideosTableProps) {
  const q = searchQuery.toLowerCase()
  const filtered = videos.filter(
    (v) =>
      v.title.toLowerCase().includes(q) ||
      (v.description ?? '').toLowerCase().includes(q) ||
      v.slug.toLowerCase().includes(q),
  )

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center px-4 py-3 border-b border-[var(--color-border)]">
        <input
          type="text"
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'h-[36px] w-[280px] px-3 rounded-lg text-[13px]',
            'border border-[var(--color-border)] outline-none transition-colors',
            'bg-[var(--color-surface)] text-[var(--color-text-body)]',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:border-[var(--color-accent)]',
          )}
        />
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              {COLUMNS.map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]',
                    col.cls,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((video, i) => (
              <tr
                key={video.id}
                className={cn(
                  'group transition-colors hover:bg-[var(--color-surface-hover)]',
                  i < filtered.length - 1 &&
                    'border-b border-[var(--color-border)]',
                )}
              >
                <td className="py-3.5 pl-4 pr-4">
                  <p className="text-[14px] font-semibold text-[var(--color-text-heading)]">
                    {video.title}
                  </p>
                  {video.description && (
                    <p className="text-[12px] text-[var(--color-text-muted)] line-clamp-1 max-w-[420px]">
                      {video.description}
                    </p>
                  )}
                  <p className="text-[11px] text-[var(--color-accent)] font-mono">
                    /v/{video.slug}
                  </p>
                </td>

                <td className="py-3.5 pr-4 w-[110px]">
                  <VideoVisibilityBadge isPublic={video.is_public} />
                </td>

                <td className="py-3.5 pr-4 w-[100px]">
                  <span className="text-[13px] tabular-nums text-[var(--color-text-body)]">
                    {formatDuration(video.duration_seconds)}
                  </span>
                </td>

                <td className="py-3.5 pr-4 w-[100px]">
                  <span className="text-[13px] tabular-nums text-[var(--color-text-muted)]">
                    {formatFileSize(video.file_size_bytes)}
                  </span>
                </td>

                <td className="py-3.5 pr-4 w-[150px]">
                  {video.creator_name ? (
                    <span className="flex items-center gap-2">
                      <Avatar
                        name={video.creator_name}
                        src={video.creator_avatar}
                        size="xs"
                      />
                      <span className="text-[13px] text-[var(--color-text-body)]">
                        {video.creator_name.split(' ')[0]}
                      </span>
                    </span>
                  ) : (
                    <span className="text-[var(--color-text-muted)]">—</span>
                  )}
                </td>

                <td className="py-3.5 pr-4 w-[110px]">
                  <span className="text-[12px] tabular-nums text-[var(--color-text-muted)]">
                    {video.created_at.split('T')[0]}
                  </span>
                </td>

                <td className="pr-4 w-10">
                  <VideoActions
                    video={video}
                    onEdit={onEdit}
                    onToggleVisibility={onToggleVisibility}
                    onCopyLink={onCopyLink}
                    onDelete={onDelete}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-[var(--color-text-muted)]">
          <p className="text-[14px]">No videos match your search</p>
        </div>
      )}
    </div>
  )
}
