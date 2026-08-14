'use client'

import { useMemo, useState } from 'react'
import { MoreHorizontal, Pencil, Trash2, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Dropdown, toast, type DropdownItem } from '@/components/ui'
import { BLOG_STATUS_CONFIG, type BlogStatusFilter } from '@/constants/blog-config'
import { useDeleteBlogPost } from '@/hooks/useBlog'
import { canDeletePost } from '@/lib/blog-permissions'
import type { AuthProfile } from '@/stores/auth-store'
import type { BlogPost } from '@/types/blog'

interface BlogPostRowProps {
  post: BlogPost
  onClick: () => void
  isFirst?: boolean
  isLast?: boolean
  profile?: AuthProfile | null
  onStatusFilterChange?: (status: BlogStatusFilter) => void
}

export function BlogPostRow({
  post,
  onClick,
  isFirst,
  isLast,
  profile = null,
  onStatusFilterChange,
}: BlogPostRowProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const deletePost = useDeleteBlogPost()
  const status = BLOG_STATUS_CONFIG[post.status]
  const authorName =
    post.author?.full_name ?? post.author_name ?? 'Unknown'
  const authorAvatar = post.author?.avatar_url ?? post.author_avatar
  const categoryName =
    typeof post.category === 'object' && post.category
      ? post.category.name
      : null

  const menuItems = useMemo<DropdownItem[]>(() => {
    const items: DropdownItem[] = [
      {
        label: 'Edit',
        icon: <Pencil size={13} />,
        onClick: () => onClick(),
      },
      {
        label: 'Preview',
        icon: <Eye size={13} />,
        onClick: () =>
          window.open(
            `/blog/${post.id}/preview`,
            '_blank',
            'noopener,noreferrer',
          ),
      },
    ]
    if (canDeletePost(profile, post)) {
      items.push({
        label: 'Delete',
        icon: <Trash2 size={13} />,
        onClick: () => setConfirmDelete(true),
        variant: 'danger',
        dividerAbove: true,
      })
    }
    return items
  }, [profile, post, onClick])

  const handleDelete = async () => {
    try {
      await deletePost.mutateAsync(post.id)
      toast.success('Post deleted')
      setConfirmDelete(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <>
      <div
        className={cn(
          'relative flex items-center gap-4 px-5 py-4 cursor-pointer',
          'transition-colors hover:bg-[var(--color-surface-hover)]',
          isFirst && 'rounded-t-xl',
          isLast && 'rounded-b-xl',
          menuOpen && 'z-20',
          !isLast && 'border-b',
        )}
        style={{ borderColor: 'var(--color-border)' }}
        onClick={() => onClick()}
      >
        <div
          className="w-[56px] h-[56px] rounded-[8px] shrink-0 flex items-center justify-center overflow-hidden"
          style={{ background: 'var(--color-accent-subtle)' }}
        >
          {post.cover_image_url ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.cover_image_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <Pencil size={18} style={{ color: 'var(--color-accent)' }} />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[15px] font-semibold truncate mb-0.5"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {post.title}
          </p>
          {(post.excerpt || categoryName) && (
            <p
              className="text-[13px] truncate mb-2"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {categoryName ? `${categoryName} · ` : ''}
              {post.excerpt ?? ''}
            </p>
          )}
          {post.tags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              {post.tags.slice(0, 4).map((tag) => (
                <span
                  key={tag}
                  onClick={(e) => e.stopPropagation()}
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
            onClick={(e) => {
              e.stopPropagation()
              onStatusFilterChange?.(post.status as BlogStatusFilter)
            }}
          >
            {status?.label}
          </span>

          <div
            className="flex items-center gap-1.5"
            onClick={(e) => e.stopPropagation()}
          >
            <Avatar name={authorName} src={authorAvatar} size="xs" />
            <span
              className="text-[12px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {authorName.split(' ')[0]}
            </span>
          </div>

          <span
            className="text-[11px] tabular-nums"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {post.view_count > 0 ? `${post.view_count} views · ` : ''}
            {(post.publish_date ?? post.updated_at).split('T')[0]}
          </span>
        </div>

        <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen((v) => !v)
            }}
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

      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative z-10 bg-[var(--color-surface)] rounded-2xl shadow-xl p-6 w-[340px] flex flex-col gap-4">
            <h3 className="text-[16px] font-bold text-[var(--color-text-heading)]">
              Delete post?
            </h3>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              This will permanently delete{' '}
              <span className="font-semibold">{post.title}</span>.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-[38px] px-4 rounded-lg text-[13px] font-medium border border-[var(--color-border)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deletePost.isPending}
                onClick={() => void handleDelete()}
                className="h-[38px] px-4 rounded-lg text-[13px] font-semibold text-white bg-[var(--color-danger)]"
              >
                {deletePost.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
