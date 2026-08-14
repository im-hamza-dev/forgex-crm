'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const MONTH_NAMES = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

interface CalendarNavProps {
  year: number
  month: number
  onPrev: () => void
  onNext: () => void
  onToday: () => void
  onPlanPost: () => void
}

export function CalendarNav({
  year,
  month,
  onPrev,
  onNext,
  onToday,
  onPlanPost,
}: CalendarNavProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onPrev}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg border transition-colors',
            'hover:bg-[var(--color-surface-hover)]',
          )}
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
          aria-label="Previous month"
        >
          <ChevronLeft size={15} />
        </button>

        <h2
          className="text-[18px] font-bold min-w-[160px] text-center"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {MONTH_NAMES[month]} {year}
        </h2>

        <button
          type="button"
          onClick={onNext}
          className={cn(
            'flex items-center justify-center w-7 h-7 rounded-lg border transition-colors',
            'hover:bg-[var(--color-surface-hover)]',
          )}
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-secondary)',
          }}
          aria-label="Next month"
        >
          <ChevronRight size={15} />
        </button>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onToday}
          className={cn(
            'h-[34px] px-4 rounded-lg text-[13px] font-medium border transition-colors',
            'hover:bg-[var(--color-surface-hover)]',
          )}
          style={{
            borderColor: 'var(--color-border)',
            color: 'var(--color-text-body)',
          }}
        >
          Today
        </button>
        <button
          type="button"
          onClick={onPlanPost}
          className="h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
          style={{ background: 'var(--color-accent)' }}
        >
          + New Entry
        </button>
      </div>
    </div>
  )
}
