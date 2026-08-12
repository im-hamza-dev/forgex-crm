'use client'

import { cn } from '@/lib/utils'

export interface SegmentedControlProps {
  options: { value: string; label: string; icon?: React.ReactNode }[]
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SegmentedControl({ options, value, onChange, className }: SegmentedControlProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-[var(--radius-md)] p-0.5',
        'bg-[var(--color-surface-hover)] border border-[var(--color-border)]',
        className,
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={cn(
            'flex items-center gap-1.5 px-3 h-[30px] text-[13px] font-medium rounded-[var(--radius-sm)]',
            'transition-colors duration-150 outline-none whitespace-nowrap',
            value === opt.value
              ? 'bg-[var(--color-surface)] text-[var(--color-text-heading)] shadow-[0_1px_2px_rgba(26,16,8,0.06)]'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-body)]',
          )}
        >
          {opt.icon && <span className="shrink-0">{opt.icon}</span>}
          {opt.label}
        </button>
      ))}
    </div>
  )
}
