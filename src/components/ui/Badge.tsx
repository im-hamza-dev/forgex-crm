import { cn } from '@/lib/utils'

export type BadgeVariant =
  | 'default'
  | 'accent'
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'muted'

export interface BadgeProps {
  variant?: BadgeVariant
  size?: 'sm' | 'md'
  className?: string
  children: React.ReactNode
}

const variantClasses: Record<BadgeVariant, string> = {
  default:  'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
  accent:   'bg-[var(--color-accent-subtle)] text-[var(--color-accent)] border border-[var(--color-accent-border)]',
  success:  'bg-[var(--color-success-bg)] text-[var(--color-success)]',
  warning:  'bg-[var(--color-warning-bg)] text-[var(--color-warning)]',
  danger:   'bg-[var(--color-danger-bg)] text-[var(--color-danger)]',
  info:     'bg-[var(--color-info-bg)] text-[var(--color-info)]',
  muted:    'bg-[var(--color-page)] text-[var(--color-text-muted)]',
}

const sizeClasses = {
  sm: 'px-2 py-0.5 text-[10px] font-semibold tracking-[0.03em]',
  md: 'px-2.5 py-1 text-[11px] font-semibold tracking-[0.02em]',
}

export function Badge({ variant = 'default', size = 'md', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[var(--radius-pill)] leading-none',
        variantClasses[variant],
        sizeClasses[size],
        className,
      )}
    >
      {children}
    </span>
  )
}
