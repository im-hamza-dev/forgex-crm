'use client'

import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { ChevronUp, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BLOG_CATEGORIES } from '@/constants/blog-config'

interface BlogSeoPanelProps {
  title: string
  seoTitle: string
  seoDescription: string
  category: string
  allowComments: boolean
  ogImageIsCover: boolean
  authorName: string
  readingTime: number | null
  onSeoTitleChange: (v: string) => void
  onSeoDescChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onAllowCommentsChange: (v: boolean) => void
  onOgImageIsCoverChange: (v: boolean) => void
}

function AccordionSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState(defaultOpen)

  return (
    <div className="border-b" style={{ borderColor: 'var(--color-border)' }}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left"
      >
        <span
          className="text-[14px] font-semibold"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {title}
        </span>
        {open ? (
          <ChevronUp size={15} style={{ color: 'var(--color-text-muted)' }} />
        ) : (
          <ChevronDown size={15} style={{ color: 'var(--color-text-muted)' }} />
        )}
      </button>
      {open && <div className="px-4 pb-4">{children}</div>}
    </div>
  )
}

function PanelLabel({
  children,
  counter,
}: {
  children: ReactNode
  counter?: string
}) {
  return (
    <div className="flex items-center justify-between mb-1.5">
      <label
        className="text-[10px] font-semibold uppercase tracking-[0.07em]"
        style={{ color: 'var(--color-text-muted)' }}
      >
        {children}
      </label>
      {counter && (
        <span
          className="text-[11px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {counter}
        </span>
      )}
    </div>
  )
}

function PanelInput({
  value,
  onChange,
  className,
  ...props
}: Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> & {
  value: string
  onChange: (v: string) => void
}) {
  return (
    <input
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'w-full h-[36px] px-3 rounded-lg text-[13px]',
        'border outline-none transition-colors',
        'border-[var(--color-border)] focus:border-[var(--color-accent)]',
        className,
      )}
      style={{
        background: 'var(--color-surface)',
        color: 'var(--color-text-body)',
      }}
      {...props}
    />
  )
}

function slugify(str: string) {
  return str
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .slice(0, 60)
}

export function BlogSeoPanel({
  title,
  seoTitle,
  seoDescription,
  category,
  allowComments,
  ogImageIsCover,
  authorName,
  readingTime,
  onSeoTitleChange,
  onSeoDescChange,
  onCategoryChange,
  onAllowCommentsChange,
  onOgImageIsCoverChange,
}: BlogSeoPanelProps) {
  const displayTitle = seoTitle || title || 'Post title'
  const displayDesc = seoDescription || 'Meta description...'
  const slug = slugify(seoTitle || title)

  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)] overflow-hidden"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <AccordionSection title="SEO" defaultOpen>
        <div className="mb-3">
          <PanelLabel counter={`${seoTitle.length}/60`}>SEO Title</PanelLabel>
          <PanelInput
            value={seoTitle}
            onChange={onSeoTitleChange}
            maxLength={60}
          />
        </div>

        <div className="mb-3">
          <PanelLabel counter={`${seoDescription.length}/160`}>
            Meta Description
          </PanelLabel>
          <textarea
            value={seoDescription}
            onChange={(e) => onSeoDescChange(e.target.value)}
            maxLength={160}
            rows={3}
            className={cn(
              'w-full px-3 py-2 rounded-lg text-[13px] resize-none',
              'border outline-none transition-colors',
              'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-body)',
            }}
          />
        </div>

        <div
          className="rounded-lg border p-3"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface-hover)',
          }}
        >
          <p
            className="text-[11px] mb-1"
            style={{ color: 'var(--color-text-muted)' }}
          >
            forgex.systems › blog › {slug || 'post-slug'}
          </p>
          <p
            className="text-[13px] font-medium mb-0.5"
            style={{ color: 'var(--color-info)' }}
          >
            {displayTitle}
          </p>
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            {displayDesc}
          </p>
          <p
            className="text-[9px] uppercase tracking-[0.08em] mt-1.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Google Preview
          </p>
        </div>
      </AccordionSection>

      <AccordionSection title="Publishing" defaultOpen={!!category}>
        <div className="mb-3">
          <PanelLabel>Category</PanelLabel>
          <div className="relative">
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className={cn(
                'w-full h-[36px] pl-3 pr-8 rounded-lg text-[13px] appearance-none',
                'border outline-none transition-colors',
                'border-[var(--color-border)] focus:border-[var(--color-accent)]',
              )}
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-body)',
              }}
            >
              <option value="">Select category</option>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
          </div>
        </div>

        <label className="flex items-center justify-between mb-2 cursor-pointer">
          <span
            className="text-[12px] font-medium uppercase tracking-[0.05em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Allow Comments
          </span>
          <input
            type="checkbox"
            checked={allowComments}
            onChange={(e) => onAllowCommentsChange(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-accent)]"
          />
        </label>

        <label className="flex items-center justify-between cursor-pointer">
          <span
            className="text-[12px] font-medium uppercase tracking-[0.05em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            OG Image = Cover
          </span>
          <input
            type="checkbox"
            checked={ogImageIsCover}
            onChange={(e) => onOgImageIsCoverChange(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-accent)]"
          />
        </label>
      </AccordionSection>

      <AccordionSection title="Author" defaultOpen={false}>
        <p
          className="text-[13px] font-medium mb-0.5"
          style={{ color: 'var(--color-text-body)' }}
        >
          {authorName}
        </p>
        <p className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
          {readingTime ? `~${readingTime} min read` : '~1 min read'}
        </p>
      </AccordionSection>
    </div>
  )
}
