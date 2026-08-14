'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BlogPostRow } from './BlogPostRow'
import { BLOG_FILTER_TABS, type BlogStatusFilter } from '@/constants/blog-config'
import type { AuthProfile } from '@/stores/auth-store'
import type { BlogPost } from '@/types/blog'

interface BlogListProps {
  posts: BlogPost[]
  onPostClick: (post: BlogPost) => void
  profile?: AuthProfile | null
  search: string
  onSearchChange: (v: string) => void
  statusFilter: BlogStatusFilter
  onStatusFilterChange: (v: BlogStatusFilter) => void
  isLoading?: boolean
}

export function BlogList({
  posts,
  onPostClick,
  profile = null,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  isLoading,
}: BlogListProps) {
  return (
    <div>
      <div
        className="flex items-center gap-3 mb-4 p-3 rounded-xl border bg-[var(--color-surface)]"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div className="relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search posts..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className={cn(
              'h-[34px] pl-8 pr-3 w-[220px] rounded-lg text-[13px]',
              'border outline-none transition-colors',
              'placeholder:text-[var(--color-text-muted)]',
              'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-body)',
            }}
          />
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          {BLOG_FILTER_TABS.map((tab) => (
            <button
              type="button"
              key={tab.value}
              onClick={() => onStatusFilterChange(tab.value)}
              className={cn(
                'h-[32px] px-3.5 rounded-full text-[13px] font-medium transition-colors',
              )}
              style={
                statusFilter === tab.value
                  ? { background: 'var(--color-action)', color: '#ffffff' }
                  : {
                      color: 'var(--color-text-secondary)',
                      background: 'transparent',
                    }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div
        className="rounded-xl border bg-[var(--color-surface)]"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {isLoading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-[72px] rounded-lg animate-pulse bg-[var(--color-surface-hover)]"
              />
            ))}
          </div>
        ) : posts.length === 0 ? (
          <div className="py-16 text-center">
            <p
              className="text-[15px] font-semibold mb-1"
              style={{ color: 'var(--color-text-body)' }}
            >
              No posts found
            </p>
            <p className="text-[13px]" style={{ color: 'var(--color-accent)' }}>
              Try adjusting your filters or create a new post
            </p>
          </div>
        ) : (
          posts.map((post, i) => (
            <BlogPostRow
              key={post.id}
              post={post}
              profile={profile}
              onClick={() => onPostClick(post)}
              isFirst={i === 0}
              isLast={i === posts.length - 1}
            />
          ))
        )}
      </div>
    </div>
  )
}
