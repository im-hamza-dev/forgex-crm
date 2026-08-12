'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  hint?: string
  leftIcon?: React.ReactNode
  rightElement?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, leftIcon, rightElement, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')

    return (
      <div className="flex flex-col gap-1.5">
        {label && (
          <label
            htmlFor={inputId}
            className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-text-secondary)]"
          >
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {leftIcon && (
            <span className="absolute left-3 flex items-center text-[var(--color-text-muted)]">
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'h-[40px] w-full rounded-[var(--radius-md)]',
              'border border-[var(--color-border)]',
              'bg-[var(--color-surface)]',
              'px-3 text-[14px] text-[var(--color-text-body)]',
              'placeholder:text-[var(--color-text-muted)]',
              'transition-colors duration-150',
              'outline-none',
              'focus:border-[var(--color-border-focus)]',
              'focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-15',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'disabled:bg-[var(--color-surface-hover)]',
              error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]',
              leftIcon && 'pl-9',
              rightElement && 'pr-10',
              className,
            )}
            {...props}
          />
          {rightElement && (
            <span className="absolute right-3 flex items-center">
              {rightElement}
            </span>
          )}
        </div>
        {error && (
          <p className="text-[12px] text-[var(--color-danger)]">{error}</p>
        )}
        {hint && !error && (
          <p className="text-[12px] text-[var(--color-text-muted)]">{hint}</p>
        )}
      </div>
    )
  },
)

Input.displayName = 'Input'
export { Input }
