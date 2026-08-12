'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronLeft, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { cn } from '@/lib/utils'
import { DashboardShell } from '@/components/layout'
import { ROUTES } from '@/constants/routes'
import type { Doc, DocCategory } from '@/types/docs'

const CATEGORIES: DocCategory[] = [
  'SOPs',
  'Templates',
  'Research',
  'Meeting Notes',
  'Other',
]

interface DocEditorProps {
  doc?: Doc | null
}

export function DocEditor({ doc }: DocEditorProps) {
  const [title, setTitle] = useState(doc?.title ?? '')
  const [content, setContent] = useState(doc?.content ?? '')
  const [category, setCategory] = useState<DocCategory>(doc?.category ?? 'SOPs')
  const [isPrivate, setIsPrivate] = useState(doc ? !doc.is_shared : false)
  const [timeAgo] = useState(doc?.time_ago ?? 'Just now')
  const [catOpen, setCatOpen] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [title])

  const breadcrumbTitle = title || 'Untitled doc'

  return (
    <DashboardShell
      title="Docs"
      breadcrumb={[
        { label: 'Docs', href: ROUTES.DOCS },
        { label: breadcrumbTitle },
      ]}
      notificationCount={3}
    >
      <div
        className="flex items-center gap-4 mb-6 pb-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <Link
          href={ROUTES.DOCS}
          className="flex items-center gap-1 text-[13px] transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ChevronLeft size={14} />
          Docs
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setCatOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 h-[28px] px-2.5 rounded-lg text-[12px] font-medium',
              'border transition-colors hover:bg-[var(--color-surface-hover)]',
            )}
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-body)',
            }}
          >
            {category}
            <ChevronDown size={11} />
          </button>
          {catOpen && (
            <div
              className={cn(
                'absolute left-0 top-full mt-1 z-10 py-1 min-w-[150px]',
                'bg-[var(--color-surface)] rounded-lg border',
                'shadow-[0_4px_16px_rgba(26,16,8,0.10)]',
              )}
              style={{ borderColor: 'var(--color-border)' }}
            >
              {CATEGORIES.map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => {
                    setCategory(cat)
                    setCatOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-3 h-[34px] text-[13px] transition-colors',
                    'hover:bg-[var(--color-surface-hover)]',
                    cat === category && 'font-semibold',
                  )}
                  style={{
                    color:
                      cat === category
                        ? 'var(--color-accent)'
                        : 'var(--color-text-body)',
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        <label className="flex items-center gap-1.5 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={isPrivate}
            onChange={(e) => setIsPrivate(e.target.checked)}
            className="w-4 h-4 accent-[var(--color-accent)]"
          />
          <span
            className="text-[13px]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            Private
          </span>
        </label>

        <span
          className="text-[12px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Last edited {timeAgo}
        </span>
      </div>

      <div className="max-w-[720px]">
        <textarea
          ref={titleRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled doc"
          rows={1}
          className={cn(
            'w-full resize-none bg-transparent border-none outline-none',
            'text-[22px] font-bold leading-tight mb-4',
            'placeholder:text-[var(--color-text-muted)]',
          )}
          style={{ color: 'var(--color-text-heading)' }}
        />

        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Start writing..."
          className={cn(
            'w-full min-h-[400px] resize-none bg-transparent border-none outline-none',
            'text-[15px] leading-relaxed',
            'placeholder:text-[var(--color-text-muted)]',
          )}
          style={{ color: 'var(--color-text-body)' }}
        />
      </div>
    </DashboardShell>
  )
}
