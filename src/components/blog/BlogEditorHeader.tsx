'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ChevronLeft, Clock, ExternalLink, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'
import type { BlogPostStatus } from '@/types/blog'

const STATUS_OPTIONS: { value: BlogPostStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
]

interface BlogEditorHeaderProps {
  status: BlogPostStatus
  onStatusChange: (status: BlogPostStatus) => void
  onSaveDraft: () => void
  onPublish: () => void
  autoSaved?: boolean
}

export function BlogEditorHeader({
  status,
  onStatusChange,
  onSaveDraft,
  onPublish,
}: BlogEditorHeaderProps) {
  const [statusOpen, setStatusOpen] = useState(false)

  return (
    <div
      className="flex items-center justify-between h-[52px] px-5 border-b bg-[var(--color-surface)] shrink-0"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex items-center gap-3">
        <Link
          href={ROUTES.BLOG}
          className="flex items-center gap-1 text-[13px] transition-opacity hover:opacity-70"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ChevronLeft size={15} />
          Blog
        </Link>

        <div className="relative">
          <button
            type="button"
            onClick={() => setStatusOpen((v) => !v)}
            className={cn(
              'flex items-center gap-1.5 h-[30px] px-3 rounded-lg text-[12px] font-medium',
              'border transition-colors hover:bg-[var(--color-surface-hover)]',
            )}
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-body)',
            }}
          >
            {STATUS_OPTIONS.find((s) => s.value === status)?.label ?? 'Draft'}
            <ChevronDown size={12} />
          </button>
          {statusOpen && (
            <div
              className={cn(
                'absolute left-0 top-full mt-1 z-10 py-1 min-w-[140px]',
                'bg-[var(--color-surface)] rounded-lg border',
                'shadow-[0_4px_16px_rgba(26,16,8,0.10)]',
              )}
              style={{ borderColor: 'var(--color-border)' }}
            >
              {STATUS_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => {
                    onStatusChange(opt.value)
                    setStatusOpen(false)
                  }}
                  className={cn(
                    'w-full text-left px-3 h-[36px] text-[13px] transition-colors',
                    'hover:bg-[var(--color-surface-hover)]',
                    opt.value === status && 'font-semibold',
                  )}
                  style={{
                    color:
                      opt.value === status
                        ? 'var(--color-accent)'
                        : 'var(--color-text-body)',
                  }}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1.5">
        <Clock size={13} style={{ color: 'var(--color-text-muted)' }} />
        <span
          className="text-[12px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Auto-saved
        </span>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onSaveDraft}
          className={cn(
            'h-[34px] px-4 rounded-lg text-[13px] font-medium border transition-colors',
            'hover:bg-[var(--color-surface-hover)]',
          )}
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-body)',
          }}
        >
          Save Draft
        </button>
        <button
          type="button"
          onClick={onPublish}
          className="h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          style={{ background: 'var(--color-accent)' }}
        >
          Publish
        </button>
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 h-[34px] px-3 rounded-lg text-[13px] font-medium',
            'border transition-colors hover:bg-[var(--color-surface-hover)]',
          )}
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-body)',
          }}
          onClick={() => console.log('Preview')}
        >
          <ExternalLink size={13} />
          Preview
        </button>
      </div>
    </div>
  )
}
