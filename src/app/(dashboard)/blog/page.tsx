'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { DashboardShell } from '@/components/layout'
import { Button } from '@/components/ui'
import { BlogList } from '@/components/blog'
import { useAuth } from '@/hooks/useAuth'
import { useBlogPosts } from '@/hooks/useBlog'
import { ROUTES } from '@/constants/routes'
import type { BlogStatusFilter } from '@/constants/blog-config'
import type { BlogFilters, BlogPost } from '@/types/blog'

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

export default function BlogPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<BlogStatusFilter>('all')
  const debouncedSearch = useDebouncedValue(search, 300)

  const filters: BlogFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: statusFilter === 'all' ? undefined : statusFilter,
    }),
    [debouncedSearch, statusFilter],
  )

  const { data: posts = [], isLoading } = useBlogPosts(filters)

  // Counts from unfiltered list for header chips — fetch all statuses lightly
  const { data: allPosts = [] } = useBlogPosts({})
  const published = allPosts.filter((p) => p.status === 'published').length
  const inReview = allPosts.filter((p) => p.status === 'in_review').length
  const scheduled = allPosts.filter((p) => p.status === 'scheduled').length

  return (
    <DashboardShell title="Blog" notificationCount={0}>
      <div className="flex items-start justify-between mb-5">
        <div>
          <h2
            className="text-[22px] font-bold leading-tight mb-1"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Blog
          </h2>
          <p
            className="text-[13px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {published} published · {inReview} in review · {scheduled} scheduled
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={15} />}
          onClick={() => router.push(ROUTES.BLOG_NEW)}
          className="rounded-lg"
        >
          New Post
        </Button>
      </div>

      <BlogList
        posts={posts}
        profile={profile}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        isLoading={isLoading}
        onPostClick={(post: BlogPost) => {
          console.log('[BlogPage] navigating to post:', post.id)
          router.push(ROUTES.BLOG_POST(post.id))
        }}
      />
    </DashboardShell>
  )
}
