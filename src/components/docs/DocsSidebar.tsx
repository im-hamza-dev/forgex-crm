'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { DocFilter } from '@/types/docs'

export type DocsFilter = DocFilter

const PRIMARY_ITEMS: { value: DocsFilter; label: string }[] = [
  { value: 'all', label: 'All Docs' },
  { value: 'my', label: 'My Docs' },
  { value: 'shared', label: 'Shared' },
]

const CATEGORY_ITEMS: { value: DocsFilter; label: string }[] = [
  { value: 'SOPs', label: 'SOPs' },
  { value: 'Playbooks', label: 'Playbooks' },
  { value: 'Templates', label: 'Templates' },
  { value: 'Research', label: 'Research' },
  { value: 'Meeting Notes', label: 'Meeting Notes' },
  { value: 'Processes', label: 'Processes' },
  { value: 'Other', label: 'Other' },
]

interface DocsSidebarProps {
  active: DocsFilter
  onChange: (filter: DocsFilter) => void
  search: string
  onSearchChange: (value: string) => void
}

function FilterButton({
  item,
  active,
  onChange,
}: {
  item: { value: DocsFilter; label: string }
  active: DocsFilter
  onChange: (filter: DocsFilter) => void
}) {
  return (
    <button
      type="button"
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
  )
}

export function DocsSidebar({
  active,
  onChange,
  search,
  onSearchChange,
}: DocsSidebarProps) {
  return (
    <div
      className="w-[185px] shrink-0 rounded-xl border bg-[var(--color-surface)] p-2 self-start"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div className="relative mb-2">
        <Search
          size={13}
          className="absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: 'var(--color-text-muted)' }}
        />
        <input
          type="search"
          placeholder="Search..."
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-[32px] w-full pl-8 pr-2 rounded-lg text-[12px] border outline-none placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-accent)]"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-page)',
            color: 'var(--color-text-body)',
          }}
        />
      </div>

      <div className="flex flex-col gap-0.5">
        {PRIMARY_ITEMS.map((item) => (
          <FilterButton
            key={item.value}
            item={item}
            active={active}
            onChange={onChange}
          />
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
        Categories
      </p>

      <div className="flex flex-col gap-0.5">
        {CATEGORY_ITEMS.map((item) => (
          <FilterButton
            key={item.value}
            item={item}
            active={active}
            onChange={onChange}
          />
        ))}
      </div>
    </div>
  )
}
