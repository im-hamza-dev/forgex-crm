'use client'

import { SegmentedControl } from '@/components/ui'
import { LEAD_STAGES } from '@/constants/lead-stages'
import { cn } from '@/lib/utils'

export type LeadsView = 'kanban' | 'list'

interface LeadsToolbarProps {
  view: LeadsView
  onViewChange: (v: LeadsView) => void
  searchQuery?: string
  onSearchChange?: (value: string) => void
  stageFilter?: string
  onStageFilterChange?: (value: string) => void
  priorityFilter?: string
  onPriorityFilterChange?: (value: string) => void
  statusFilter?: string
  onStatusFilterChange?: (value: string) => void
  filterActive?: boolean
}

export function LeadsToolbar({
  view,
  onViewChange,
  searchQuery = '',
  onSearchChange,
  stageFilter = '',
  onStageFilterChange,
  priorityFilter = '',
  onPriorityFilterChange,
  statusFilter = '',
  onStatusFilterChange,
}: LeadsToolbarProps) {
  return (
    <div className="flex items-center gap-2 flex-wrap">
      <SegmentedControl
        value={view}
        onChange={(v) => onViewChange(v as LeadsView)}
        options={[
          { value: 'kanban', label: 'Kanban' },
          { value: 'list', label: 'List' },
        ]}
      />

      <input
        type="search"
        value={searchQuery}
        onChange={(e) => onSearchChange?.(e.target.value)}
        placeholder="Search leads..."
        className={cn(
          'h-[34px] w-[200px] px-3 rounded-lg text-[13px]',
          'border border-[var(--color-border)] outline-none',
          'bg-[var(--color-surface)] text-[var(--color-text-body)]',
          'placeholder:text-[var(--color-text-muted)]',
          'focus:border-[var(--color-accent)]',
        )}
      />

      <select
        value={stageFilter}
        onChange={(e) => onStageFilterChange?.(e.target.value)}
        className={cn(
          'h-[34px] px-2.5 rounded-lg text-[12px]',
          'border border-[var(--color-border)] outline-none',
          'bg-[var(--color-surface)] text-[var(--color-text-body)]',
        )}
      >
        <option value="">All stages</option>
        {LEAD_STAGES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      <select
        value={priorityFilter}
        onChange={(e) => onPriorityFilterChange?.(e.target.value)}
        className={cn(
          'h-[34px] px-2.5 rounded-lg text-[12px]',
          'border border-[var(--color-border)] outline-none',
          'bg-[var(--color-surface)] text-[var(--color-text-body)]',
        )}
      >
        <option value="">All priorities</option>
        <option value="hot">Hot</option>
        <option value="warm">Warm</option>
        <option value="cold">Cold</option>
      </select>

      <select
        value={statusFilter}
        onChange={(e) => onStatusFilterChange?.(e.target.value)}
        className={cn(
          'h-[34px] px-2.5 rounded-lg text-[12px]',
          'border border-[var(--color-border)] outline-none',
          'bg-[var(--color-surface)] text-[var(--color-text-body)]',
        )}
      >
        <option value="">All statuses</option>
        <option value="active">Active</option>
        <option value="won">Won</option>
        <option value="lost">Lost</option>
        <option value="archived">Archived</option>
      </select>
    </div>
  )
}
