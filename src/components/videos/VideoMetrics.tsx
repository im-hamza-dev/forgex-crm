'use client'

import { Eye, Play } from 'lucide-react'
import { cn } from '@/lib/utils'

interface VideoMetricsProps {
  viewCount: number
  playCount: number
  onClick?: () => void
  className?: string
}

export function VideoMetrics({
  viewCount,
  playCount,
  onClick,
  className,
}: VideoMetricsProps) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        onClick?.()
      }}
      className={cn(
        'inline-flex items-center gap-3 text-[11px] tabular-nums text-[var(--color-text-muted)]',
        onClick &&
          'rounded-md px-1.5 py-0.5 -mx-1.5 hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-body)] transition-colors',
        className,
      )}
      aria-label={`${viewCount} views, ${playCount} plays. Open activity.`}
    >
      <span className="inline-flex items-center gap-1">
        <Eye size={12} />
        {viewCount}
      </span>
      <span className="inline-flex items-center gap-1">
        <Play size={12} />
        {playCount}
      </span>
    </button>
  )
}
