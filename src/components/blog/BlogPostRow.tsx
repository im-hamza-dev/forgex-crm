'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Dropdown, type DropdownItem } from '@/components/ui'
import { BLOG_STATUS_CONFIG } from '@/constants/blog-config'
import type { BlogPost } from '@/types/blog'

interface BlogPostRowProps {
  post: BlogPost
  onClick: () => void
  isLast?: boolean
}

export function BlogPostRow({ post, onClick, isLast }: BlogPostRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const status = BLOG_STATUS_CONFIG[post.status]

  const menuItems: DropdownItem[] = [
    {
      label: 'Edit',
      icon: <Pencil size={13} />,
      onClick: () => onClick(),
    },
    {
      label: 'Preview',
      icon: <Eye size={13} />,
      onClick: () => console.log('preview'),
    },
    {
      label: 'Delete',
      icon: <Trash2 size={13} />,
      onClick: () => console.log('delete'),
      variant: 'danger',
      dividerAbove: true,
    },
  ]

  return (
    <div
      className={cn(
        'flex items-center gap-4 px-5 py-4 cursor-pointer',
        'transition-colors hover:bg-[var(--color-surface-hover)]',
        !isLast && 'border-b',
      )}
      style={{ borderColor: 'var(--color-border)' }}
      onClick={onClick}
    >
      <div
        className="w-[56px] h-[56px] rounded-[8px] shrink-0 flex items-center justify-center"
        style={{ background: 'var(--color-accent-subtle)' }}
      >
        <Pencil size={18} style={{ color: 'var(--color-accent)' }} />
      </div>

      <div className="flex-1 min-w-0">
        <p
          className="text-[15px] font-semibold truncate mb-0.5"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {post.title}
        </p>
        {post.excerpt && (
          <p
            className="text-[13px] truncate mb-2"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {post.excerpt}
          </p>
        )}
        {post.tags.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            {post.tags.slice(0, 4).map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  background: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      <div
        className="flex flex-col items-end gap-1.5 shrink-0 min-w-[120px]"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{ background: status?.badgeBg, color: status?.badgeText }}
        >
          {status?.label}
        </span>

        <div className="flex items-center gap-1.5">
          <Avatar name={post.author_name} src={post.author_avatar} size="xs" />
          <span
            className="text-[12px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {post.author_name.split(' ')[0]}
          </span>
        </div>

        <span
          className="text-[11px] tabular-nums"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {post.publish_date ?? post.updated_at.split('T')[0]}
        </span>
      </div>

      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg',
            'text-[var(--color-text-muted)] transition-colors',
            'hover:bg-[var(--color-surface-hover)]',
          )}
          aria-label="Post options"
        >
          <MoreHorizontal size={14} />
        </button>
        <Dropdown
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          items={menuItems}
          align="right"
        />
      </div>
    </div>
  )
}
