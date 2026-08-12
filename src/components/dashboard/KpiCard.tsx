'use client'

import { cn } from '@/lib/utils'

export interface KpiCardProps {
  label: string
  value: string | number
  sub: string
  subVariant?: 'success' | 'danger' | 'warning' | 'muted'
  onClick?: () => void
}

const subColors = {
  success: 'text-[var(--color-success)]',
  danger: 'text-[var(--color-danger)]',
  warning: 'text-[var(--color-warning)]',
  muted: 'text-[var(--color-text-muted)]',
}

export function KpiCard({
  label,
  value,
  sub,
  subVariant = 'muted',
  onClick,
}: KpiCardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
      className={cn(
        'rounded-xl border border-[var(--color-border)] p-5',
        'bg-[var(--color-surface)]',
        'transition-shadow duration-150',
        onClick && 'cursor-pointer hover:shadow-md',
      )}
    >
      <p className="text-[11px] font-semibold uppercase tracking-[0.07em] mb-3 text-[var(--color-text-muted)]">
        {label}
      </p>
      <p className="text-[42px] font-bold leading-none mb-1.5 tracking-tight text-[var(--color-text-heading)]">
        {value}
      </p>
      <p className={cn('text-[13px] font-medium', subColors[subVariant])}>
        {sub}
      </p>
    </div>
  )
}
