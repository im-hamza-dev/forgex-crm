import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicVideo } from '@/server/videos/get-public-video.server'
import { PublicVideoPlayer } from '@/components/videos/PublicVideoPlayer'

type PageProps = {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params
  const video = await getPublicVideo(slug)

  // Minimal metadata for anything private, deleted or missing — the response
  // must not hint that a video exists at this slug.
  if (!video) {
    return {
      title: 'Video',
      robots: { index: false, follow: false },
    }
  }

  return {
    title: video.title,
    description: video.description ?? undefined,
    // Kept out of search indexes: slugs are readable and therefore guessable,
    // so these pages should only be reachable by someone holding the link.
    // Link unfurls still work, they don't depend on indexing.
    robots: { index: false, follow: false },
    openGraph: {
      title: video.title,
      description: video.description ?? undefined,
      type: 'video.other',
    },
  }
}

export default async function PublicVideoPage({ params }: PageProps) {
  const { slug } = await params
  const video = await getPublicVideo(slug)

  // Always 404, never 403: a "forbidden" would confirm the video exists.
  if (!video) notFound()

  return (
    <main className="min-h-screen bg-[var(--color-page)] px-4 py-8 sm:px-6 sm:py-12 lg:px-10 lg:py-16">
      <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
        {/* Title / description — full width on mobile, 30% on desktop */}
        <aside className="order-2 flex w-full flex-col lg:order-1 lg:w-[30%] lg:shrink-0">
          <p className="mb-4 text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
            Forgex Systems
          </p>
          <h1 className="text-[22px] font-bold leading-tight text-[var(--color-text-heading)] sm:text-[26px] lg:text-[28px]">
            {video.title}
          </h1>
          {video.description && (
            <p className="mt-4 whitespace-pre-line text-[14px] leading-relaxed text-[var(--color-text-secondary)] sm:text-[15px]">
              {video.description}
            </p>
          )}
        </aside>

        {/* Player — full width on mobile, 70% on desktop */}
        <div className="order-1 w-full lg:order-2 lg:w-[70%] lg:min-w-0">
          <PublicVideoPlayer
            slug={slug}
            title={video.title}
            description={video.description}
            signedUrl={video.signedUrl}
          />
        </div>
      </div>
    </main>
  )
}
