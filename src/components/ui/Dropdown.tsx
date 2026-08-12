'use client'

import { useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'

export interface DropdownItem {
  label: string
  icon?: React.ReactNode
  onClick?: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
  dividerAbove?: boolean
}

export interface DropdownProps {
  open: boolean
  onClose: () => void
  items: DropdownItem[]
  align?: 'left' | 'right'
  className?: string
}

export function Dropdown({ open, onClose, items, align = 'right', className }: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      ref={ref}
      className={cn(
        'absolute z-[150] mt-1 py-1 min-w-[180px]',
        'bg-[var(--color-surface)] rounded-[var(--radius-lg)]',
        'border border-[var(--color-border)]',
        'shadow-[0_4px_16px_rgba(26,16,8,0.10),0_1px_4px_rgba(26,16,8,0.06)]',
        align === 'right' ? 'right-0' : 'left-0',
        className,
      )}
    >
      {items.map((item, i) => (
        <div key={i}>
          {item.dividerAbove && (
            <div className="my-1 h-px bg-[var(--color-border)]" />
          )}
          <button
            onClick={() => { item.onClick?.(); onClose() }}
            disabled={item.disabled}
            className={cn(
              'w-full flex items-center gap-2.5 px-3.5 h-[36px] text-[14px] text-left',
              'transition-colors duration-100',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              item.variant === 'danger'
                ? 'text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]'
                : 'text-[var(--color-text-body)] hover:bg-[var(--color-surface-hover)]',
            )}
          >
            {item.icon && (
              <span className="shrink-0 text-[var(--color-text-muted)]">{item.icon}</span>
            )}
            {item.label}
          </button>
        </div>
      ))}
    </div>
  )
}
