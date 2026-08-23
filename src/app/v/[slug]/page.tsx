import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getPublicVideo } from '@/server/videos/get-public-video.server'
import { buildPosterDataUri } from '@/lib/videos/poster'

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
    <main className="min-h-screen bg-[var(--color-page)] px-4 py-10 sm:py-16">
      <div className="mx-auto w-full max-w-[900px]">
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)] bg-black shadow-[0_16px_48px_rgba(26,16,8,0.16)]">
          <video
            controls
            playsInline
            preload="metadata"
            poster={buildPosterDataUri(video.title, video.description)}
            src={video.signedUrl}
            className="block w-full aspect-video bg-black"
          >
            Your browser cannot play this video.
          </video>
        </div>

        <div className="mt-6">
          <h1 className="text-[24px] font-bold leading-tight text-[var(--color-text-heading)]">
            {video.title}
          </h1>
          {video.description && (
            <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-[var(--color-text-secondary)]">
              {video.description}
            </p>
          )}
        </div>

        <p className="mt-10 text-[12px] font-medium uppercase tracking-[0.14em] text-[var(--color-text-muted)]">
          Forgex Systems
        </p>
      </div>
    </main>
  )
}
