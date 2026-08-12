'use client'

import { cn } from '@/lib/utils'
import type { DocCategory } from '@/types/docs'

export type DocsFilter = 'all' | DocCategory | 'private' | 'shared'

const CATEGORY_ITEMS: { value: DocsFilter; label: string }[] = [
  { value: 'all', label: 'All Docs' },
  { value: 'SOPs', label: 'SOPs' },
  { value: 'Templates', label: 'Templates' },
  { value: 'Research', label: 'Research' },
  { value: 'Meeting Notes', label: 'Meeting Notes' },
  { value: 'Other', label: 'Other' },
]

const PRIVATE_ITEMS: { value: DocsFilter; label: string }[] = [
  { value: 'private', label: 'My Private Docs' },
  { value: 'shared', label: 'Shared with team' },
]

interface DocsSidebarProps {
  active: DocsFilter
  onChange: (filter: DocsFilter) => void
}

export function DocsSidebar({ active, onChange }: DocsSidebarProps) {
  return (
    <div
      className="w-[185px] shrink-0 rounded-xl border bg-[var(--color-surface)] p-2 self-start"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="flex flex-col gap-0.5">
        {CATEGORY_ITEMS.map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
              active === item.value
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <div
        className="my-2 h-px mx-1"
        style={{ background: 'var(--color-border)' }}
      />

      <p
        className="px-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em]"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Private
      </p>

      <div className="flex flex-col gap-0.5">
        {PRIVATE_ITEMS.map((item) => (
          <button
            type="button"
            key={item.value}
            onClick={() => onChange(item.value)}
            className={cn(
              'w-full text-left px-3 py-2 rounded-lg text-[13px] font-medium transition-colors',
              active === item.value
                ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]',
            )}
          >
            {item.label}
          </button>
        ))}
      </div>
    </div>
  )
}
