'use client'

import { cn } from '@/lib/utils'
import { Button } from './Button'

export interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-16 px-8 text-center',
        className,
      )}
    >
      <div className="mb-4 flex items-center justify-center text-[var(--color-text-disabled)]">
        {icon}
      </div>
      <h3 className="text-[15px] font-semibold text-[var(--color-text-body)] mb-1.5">
        {title}
      </h3>
      {description && (
        <p className="text-[13px] text-[var(--color-text-muted)] max-w-[280px] leading-relaxed mb-6">
          {description}
        </p>
      )}
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
