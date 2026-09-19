'use client'

import { useRef, useState } from 'react'
import {
  Activity,
  Eye,
  EyeOff,
  Link2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dropdown, type DropdownItem } from '@/components/ui'
import type { Video } from '@/types/videos'

interface VideoActionsProps {
  video: Video
  onEdit: (video: Video) => void
  onToggleVisibility: (video: Video) => void
  onCopyLink: (video: Video) => void
  onDelete: (video: Video) => void
  onActivity?: (video: Video) => void
  className?: string
  alwaysVisible?: boolean
}

export function VideoActions({
  video,
  onEdit,
  onToggleVisibility,
  onCopyLink,
  onDelete,
  onActivity,
  className,
  alwaysVisible = false,
}: VideoActionsProps) {
  const [open, setOpen] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)

  return (
    <div className={cn('relative', className)}>
      <button
        ref={triggerRef}
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          setOpen((v) => !v)
        }}
        className={cn(
          'flex items-center justify-center w-7 h-7 rounded-lg transition-opacity',
          'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]',
          !alwaysVisible && 'opacity-0 group-hover:opacity-100',
          open && 'opacity-100',
        )}
        aria-label="Video actions"
      >
        <MoreHorizontal size={14} />
      </button>

      <Dropdown
        open={open}
        onClose={() => setOpen(false)}
        anchorRef={triggerRef}
        items={[
          {
            label: 'Edit details',
            icon: <Pencil size={14} />,
            onClick: () => onEdit(video),
          },
          {
            label: video.is_public ? 'Make private' : 'Make public',
            icon: video.is_public ? <EyeOff size={14} /> : <Eye size={14} />,
            onClick: () => onToggleVisibility(video),
          },
          {
            label: 'Copy public link',
            icon: <Link2 size={14} />,
            onClick: () => onCopyLink(video),
          },
          ...(onActivity
            ? ([
                {
                  label: 'View activity',
                  icon: <Activity size={14} />,
                  onClick: () => onActivity(video),
                },
              ] satisfies DropdownItem[])
            : []),
          {
            label: 'Delete',
            icon: <Trash2 size={14} />,
            variant: 'danger',
            dividerAbove: true,
            onClick: () => onDelete(video),
          },
        ]}
      />
    </div>
  )
}
