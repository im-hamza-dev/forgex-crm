'use client'

import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  badge?: number
}

export interface TabsProps {
  items: TabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
}

export function Tabs({ items, active, onChange, className }: TabsProps) {
  return (
    <div
      className={cn(
        'flex items-end gap-0 border-b border-[var(--color-border)]',
        className,
      )}
    >
      {items.map((item) => (
        <button
          key={item.id}
          onClick={() => onChange(item.id)}
          className={cn(
            'relative flex items-center gap-1.5 px-4 h-[44px] text-[14px]',
            'transition-colors duration-150 outline-none select-none whitespace-nowrap',
            active === item.id
              ? 'text-[var(--color-text-heading)] font-semibold'
              : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-body)] font-normal',
          )}
        >
          {item.label}
          {item.badge !== undefined && item.badge > 0 && (
            <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-[var(--color-accent-subtle)] text-[var(--color-accent)] text-[10px] font-semibold">
              {item.badge}
            </span>
          )}
          {active === item.id && (
            <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-[var(--color-accent)] rounded-t-full" />
          )}
        </button>
      ))}
    </div>
  )
}
