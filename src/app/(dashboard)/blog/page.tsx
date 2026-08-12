'use client'

import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { DashboardShell } from '@/components/layout'
import { Button } from '@/components/ui'
import { BlogList } from '@/components/blog'
import { MOCK_POSTS } from '@/components/blog/mock-data'
import { ROUTES } from '@/constants/routes'
import type { BlogPost } from '@/types/blog'

export default function BlogPage() {
  const router = useRouter()

  // Static mock stats matching Figma
  const published = 24
  const inReview = 3
  const scheduled = 2

  return (
    <DashboardShell title="Blog" notificationCount={3}>
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
        posts={MOCK_POSTS}
        onPostClick={(post: BlogPost) => router.push(ROUTES.BLOG_POST(post.id))}
      />
    </DashboardShell>
  )
}
