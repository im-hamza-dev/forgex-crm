'use client'

import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { ChevronUp, ChevronDown, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuth } from '@/hooks/useAuth'
import {
  useBlogCategories,
  useCreateBlogCategory,
} from '@/hooks/useBlog'
import { canFeaturePost, canManageCategories } from '@/lib/blog-permissions'
import { toast } from '@/components/ui'

interface BlogSeoPanelProps {
  title: string
  seoTitle: string
  seoDescription: string
  categoryId: string
  tags: string[]
  tagsInput: string
  allowComments: boolean
  ogImageIsCover: boolean
  isFeatured: boolean
  authorName: string
  readingTime: number | null
  onSeoTitleChange: (v: string) => void
  onSeoDescChange: (v: string) => void
  onCategoryChange: (v: string) => void
  onTagsInputChange: (v: string) => void
  onTagsChange: (tags: string[]) => void
  onAllowCommentsChange: (v: boolean) => void
  onOgImageIsCoverChange: (v: boolean) => void
  onIsFeaturedChange?: (v: boolean) => void
  faqs: Array<{ question: string; answer: string }>
  onFaqsChange: (faqs: Array<{ question: string; answer: string }>) => void
  canEdit?: boolean
  status?: string
  publishDate?: string
  onPublishDateChange?: (date: string) => void
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
  categoryId,
  tags,
  tagsInput,
  allowComments,
  ogImageIsCover,
  isFeatured,
  authorName,
  readingTime,
  onSeoTitleChange,
  onSeoDescChange,
  onCategoryChange,
  onTagsInputChange,
  onTagsChange,
  onAllowCommentsChange,
  onOgImageIsCoverChange,
  onIsFeaturedChange,
  faqs,
  onFaqsChange,
  canEdit = true,
  status,
  publishDate,
  onPublishDateChange,
}: BlogSeoPanelProps) {
  const { profile } = useAuth()
  const { data: categories = [] } = useBlogCategories()
  const createCategory = useCreateBlogCategory()
  const [newCategory, setNewCategory] = useState('')

  const displayTitle = seoTitle || title || 'Post title'
  const displayDesc = seoDescription || 'Meta description...'
  const slug = slugify(seoTitle || title)
  const canFeature = canFeaturePost(profile)
  const canCreateCat = canManageCategories(profile)

  const commitTags = (raw: string) => {
    const next = raw
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean)
    onTagsChange(next)
  }

  const handleCreateCategory = async () => {
    if (!newCategory.trim()) return
    try {
      const cat = await createCategory.mutateAsync({ name: newCategory.trim() })
      onCategoryChange(cat.id)
      setNewCategory('')
      toast.success('Category created')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create')
    }
  }

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

      <AccordionSection title="FAQs" defaultOpen>
        <p
          className="text-[12px] leading-relaxed mb-3"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Add Q&amp;A pairs that AI systems can extract as citations.
        </p>

        <div className="space-y-3">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className="rounded-lg border p-3"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <div className="flex items-start justify-between gap-2 mb-2">
                <PanelLabel>Question {index + 1}</PanelLabel>
                <button
                  type="button"
                  onClick={() =>
                    onFaqsChange(faqs.filter((_, i) => i !== index))
                  }
                  aria-label={`Remove FAQ ${index + 1}`}
                  className="h-6 w-6 flex items-center justify-center rounded-md text-[14px] leading-none hover:bg-[var(--color-surface-hover)]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  ×
                </button>
              </div>
              <PanelInput
                value={faq.question}
                onChange={(v) => {
                  const next = faqs.map((item, i) =>
                    i === index ? { ...item, question: v } : item,
                  )
                  onFaqsChange(next)
                }}
                placeholder="What question will readers ask?"
                className="mb-2"
              />
              <PanelLabel>Answer</PanelLabel>
              <textarea
                value={faq.answer}
                onChange={(e) => {
                  const next = faqs.map((item, i) =>
                    i === index
                      ? { ...item, answer: e.target.value }
                      : item,
                  )
                  onFaqsChange(next)
                }}
                rows={3}
                placeholder="Clear, citable answer..."
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
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            onFaqsChange([...faqs, { question: '', answer: '' }])
          }
          className="mt-3 h-[36px] w-full rounded-lg text-[12px] font-medium border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)] transition-colors"
          style={{ color: 'var(--color-text-body)' }}
        >
          Add FAQ
        </button>
      </AccordionSection>

      <AccordionSection title="Publishing" defaultOpen>
        <div className="mb-3">
          <PanelLabel>Category</PanelLabel>
          <div className="relative">
            <select
              value={categoryId}
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
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <ChevronDown
              size={13}
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2"
              style={{ color: 'var(--color-text-muted)' }}
            />
          </div>
          {canCreateCat && (
            <div className="flex gap-1.5 mt-2">
              <PanelInput
                value={newCategory}
                onChange={setNewCategory}
                placeholder="New category..."
              />
              <button
                type="button"
                onClick={() => void handleCreateCategory()}
                disabled={createCategory.isPending}
                className="h-[36px] px-3 rounded-lg text-[12px] font-medium shrink-0 border border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]"
              >
                Add
              </button>
            </div>
          )}
        </div>

        <div className="mb-3">
          <PanelLabel>Tags</PanelLabel>
          <PanelInput
            value={tagsInput}
            onChange={(v) => {
              onTagsInputChange(v)
              commitTags(v)
            }}
            placeholder="ai, saas, crm"
          />
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={{
                    background: 'var(--color-accent-subtle)',
                    color: 'var(--color-accent)',
                  }}
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() => {
                      const next = tags.filter((t) => t !== tag)
                      onTagsChange(next)
                      onTagsInputChange(next.join(', '))
                    }}
                    aria-label={`Remove ${tag}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {status === 'scheduled' && (
          <div className="mb-3">
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Publish Date
            </p>
            <input
              type="date"
              value={publishDate ?? ''}
              disabled={!canEdit}
              onChange={(e) => onPublishDateChange?.(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full h-[36px] px-3 rounded-lg text-[13px] border outline-none transition-colors focus:border-[var(--color-accent)] disabled:opacity-50"
              style={{
                borderColor: 'var(--color-border)',
                background: 'var(--color-surface)',
                color: 'var(--color-text-body)',
              }}
            />
            {publishDate && (
              <p
                className="text-[11px] mt-1"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Will publish on{' '}
                {new Date(publishDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            )}
          </div>
        )}

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

        <label className="flex items-center justify-between mb-2 cursor-pointer">
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

        {canFeature && (
          <label className="flex items-center justify-between cursor-pointer">
            <span
              className="text-[12px] font-medium uppercase tracking-[0.05em]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Featured
            </span>
            <input
              type="checkbox"
              checked={isFeatured}
              onChange={(e) => onIsFeaturedChange?.(e.target.checked)}
              className="w-4 h-4 accent-[var(--color-accent)]"
            />
          </label>
        )}
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
