'use client'

import { use, type ReactNode } from 'react'
import Link from 'next/link'
import { ArrowLeft, Clock, Calendar, Eye } from 'lucide-react'
import { useBlogPost } from '@/hooks/useBlog'
import { Avatar } from '@/components/ui'
import { BLOG_STATUS_CONFIG } from '@/constants/blog-config'
import { cn } from '@/lib/utils'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function renderTipTapNode(
  node: Record<string, unknown>,
  key: number,
): ReactNode {
  const type = node.type as string
  const content = (node.content as Record<string, unknown>[] | undefined) ?? []
  const attrs = (node.attrs as Record<string, unknown> | undefined) ?? {}

  switch (type) {
    case 'doc':
      return (
        <div key={key}>
          {content.map((child, i) => renderTipTapNode(child, i))}
        </div>
      )

    case 'paragraph':
      return (
        <p
          key={key}
          className="mb-4 leading-relaxed text-[16px] text-[var(--color-text-body)]"
        >
          {content.length > 0
            ? content.map((child, i) => renderTipTapNode(child, i))
            : <br />}
        </p>
      )

    case 'heading': {
      const level = (attrs.level as number) ?? 1
      const text = content.map((child, i) => renderTipTapNode(child, i))
      const className = cn(
        'font-bold text-[var(--color-text-heading)] mt-8 mb-3',
        level === 1 && 'text-[32px]',
        level === 2 && 'text-[24px]',
        level === 3 && 'text-[20px]',
        level === 4 && 'text-[18px]',
      )
      if (level === 1)
        return (
          <h1 key={key} className={className}>
            {text}
          </h1>
        )
      if (level === 2)
        return (
          <h2 key={key} className={className}>
            {text}
          </h2>
        )
      if (level === 3)
        return (
          <h3 key={key} className={className}>
            {text}
          </h3>
        )
      return (
        <h4 key={key} className={className}>
          {text}
        </h4>
      )
    }

    case 'text': {
      const marks = (node.marks as Record<string, unknown>[] | undefined) ?? []
      let el: ReactNode = node.text as string
      marks.forEach((mark) => {
        const markType = mark.type as string
        const markAttrs =
          (mark.attrs as Record<string, unknown> | undefined) ?? {}
        if (markType === 'bold') {
          el = (
            <strong key={key} className="font-semibold">
              {el}
            </strong>
          )
        } else if (markType === 'italic') {
          el = <em key={key}>{el}</em>
        } else if (markType === 'underline') {
          el = <u key={key}>{el}</u>
        } else if (markType === 'strike') {
          el = <s key={key}>{el}</s>
        } else if (markType === 'code') {
          el = (
            <code
              key={key}
              className="px-1.5 py-0.5 rounded text-[14px] font-mono"
              style={{
                background: 'var(--color-surface-hover)',
                color: 'var(--color-accent)',
              }}
            >
              {el}
            </code>
          )
        } else if (markType === 'link') {
          el = (
            <a
              key={key}
              href={String(markAttrs.href ?? '')}
              target="_blank"
              rel="noreferrer"
              className="text-[var(--color-accent)] underline hover:opacity-70"
            >
              {el}
            </a>
          )
        }
      })
      return el
    }

    case 'bulletList':
      return (
        <ul key={key} className="list-disc pl-6 mb-4 space-y-1">
          {content.map((child, i) => renderTipTapNode(child, i))}
        </ul>
      )

    case 'orderedList':
      return (
        <ol key={key} className="list-decimal pl-6 mb-4 space-y-1">
          {content.map((child, i) => renderTipTapNode(child, i))}
        </ol>
      )

    case 'listItem':
      return (
        <li
          key={key}
          className="text-[16px] text-[var(--color-text-body)] leading-relaxed"
        >
          {content.map((child, i) => renderTipTapNode(child, i))}
        </li>
      )

    case 'blockquote':
      return (
        <blockquote
          key={key}
          className="border-l-4 pl-4 my-4 italic"
          style={{
            borderColor: 'var(--color-accent)',
            color: 'var(--color-text-secondary)',
          }}
        >
          {content.map((child, i) => renderTipTapNode(child, i))}
        </blockquote>
      )

    case 'codeBlock':
      return (
        <pre
          key={key}
          className="rounded-xl p-4 my-4 overflow-x-auto text-[14px] font-mono"
          style={{
            background: 'var(--color-surface-hover)',
            color: 'var(--color-text-body)',
          }}
        >
          <code>
            {content.map((child, i) => renderTipTapNode(child, i))}
          </code>
        </pre>
      )

    case 'horizontalRule':
      return (
        <hr
          key={key}
          className="my-8"
          style={{ borderColor: 'var(--color-border)' }}
        />
      )

    case 'hardBreak':
      return <br key={key} />

    case 'image':
      return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={key}
          src={String(attrs.src ?? '')}
          alt={String(attrs.alt ?? '')}
          className="rounded-xl max-w-full my-4"
        />
      )

    default:
      return null
  }
}

function renderBody(body: unknown): ReactNode {
  if (!body || typeof body !== 'object') {
    return (
      <p className="text-[var(--color-text-muted)] italic">No content yet.</p>
    )
  }
  return renderTipTapNode(body as Record<string, unknown>, 0)
}

export default function BlogPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const isValid = UUID_REGEX.test(id)
  const { data: post, isLoading } = useBlogPost(isValid ? id : null)

  if (isLoading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-page)' }}
      >
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!post) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--color-page)' }}
      >
        <p className="text-[14px] text-[var(--color-text-muted)]">
          Post not found
        </p>
      </div>
    )
  }

  const statusConfig = BLOG_STATUS_CONFIG[post.status]
  const publishedDate = post.published_at ?? post.created_at
  const formattedDate = publishedDate
    ? new Date(publishedDate).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null

  const authorName = post.author?.full_name ?? post.author_name ?? 'Forgex Team'
  const authorAvatar = post.author?.avatar_url ?? post.author_avatar ?? null
  const categoryName =
    post.category && typeof post.category === 'object'
      ? post.category.name
      : null

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-page)' }}>
      <div
        className="sticky top-0 z-10 flex items-center justify-between h-[52px] px-6 border-b"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <Link
          href={`/blog/${id}`}
          className="flex items-center gap-1.5 text-[13px] font-medium transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft size={15} />
          Back to editor
        </Link>

        <div className="flex items-center gap-2">
          <span
            className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{
              background: statusConfig?.badgeBg ?? '#F5F5F5',
              color: statusConfig?.badgeText ?? '#6B6B6B',
            }}
          >
            {statusConfig?.label ?? post.status}
          </span>
          <span
            className="flex items-center gap-1 text-[12px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <Eye size={12} />
            Preview mode
          </span>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-6 py-12">
        {post.cover_image_url && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.cover_image_url}
            alt={post.title}
            className="w-full rounded-2xl object-cover mb-8"
            style={{ maxHeight: '400px' }}
          />
        )}

        <div className="flex items-center gap-2 mb-4 flex-wrap">
          {categoryName && (
            <span
              className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{
                background: 'var(--color-accent-subtle)',
                color: 'var(--color-accent)',
              }}
            >
              {categoryName}
            </span>
          )}
          {(post.tags ?? []).map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium border"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              {tag}
            </span>
          ))}
        </div>

        <h1
          className="text-[36px] font-bold leading-tight mb-4"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {post.title}
        </h1>

        {post.excerpt && (
          <p
            className="text-[18px] leading-relaxed mb-6"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {post.excerpt}
          </p>
        )}

        <div
          className="flex items-center gap-3 pb-6 mb-8 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Avatar name={authorName} src={authorAvatar} size="sm" />
          <div>
            <p
              className="text-[14px] font-semibold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {authorName}
            </p>
            <div
              className="flex items-center gap-3 text-[12px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {formattedDate && (
                <span className="flex items-center gap-1">
                  <Calendar size={11} />
                  {formattedDate}
                </span>
              )}
              {post.reading_time_minutes ? (
                <span className="flex items-center gap-1">
                  <Clock size={11} />
                  {post.reading_time_minutes} min read
                </span>
              ) : null}
            </div>
          </div>
        </div>

        <div className="blog-preview-content">{renderBody(post.body)}</div>
      </div>
    </div>
  )
}
