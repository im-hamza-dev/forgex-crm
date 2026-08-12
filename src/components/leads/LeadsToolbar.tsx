'use client'

import { SlidersHorizontal } from 'lucide-react'
import { SegmentedControl, Button } from '@/components/ui'
import { cn } from '@/lib/utils'

export type LeadsView = 'kanban' | 'list'

interface LeadsToolbarProps {
  view: LeadsView
  onViewChange: (v: LeadsView) => void
  onFilter: () => void
  filterActive?: boolean
}

export function LeadsToolbar({
  view,
  onViewChange,
  onFilter,
  filterActive = false,
}: LeadsToolbarProps) {
  return (
    <div className="flex items-center gap-2">
      <SegmentedControl
        value={view}
        onChange={(v) => onViewChange(v as LeadsView)}
        options={[
          { value: 'kanban', label: 'Kanban' },
          { value: 'list', label: 'List' },
        ]}
      />
      <Button
        variant="ghost"
        size="sm"
        icon={<SlidersHorizontal size={14} />}
        onClick={onFilter}
        className={cn(
          filterActive && 'border-[var(--color-accent)] text-[var(--color-accent)]',
        )}
      >
        Filter
      </Button>
    </div>
  )
}
