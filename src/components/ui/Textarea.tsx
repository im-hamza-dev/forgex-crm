'use client'

import { forwardRef } from 'react'
import { cn } from '@/lib/utils'

export interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
  error?: string
  hint?: string
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, hint, className, id, ...props }, ref) => {
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
        <textarea
          ref={ref}
          id={inputId}
          className={cn(
            'min-h-[80px] w-full rounded-[var(--radius-md)]',
            'border border-[var(--color-border)]',
            'bg-[var(--color-surface)]',
            'px-3 py-2.5 text-[14px] text-[var(--color-text-body)]',
            'placeholder:text-[var(--color-text-muted)]',
            'transition-colors duration-150 resize-y',
            'outline-none',
            'focus:border-[var(--color-border-focus)]',
            'focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-15',
            'disabled:opacity-50 disabled:cursor-not-allowed',
            error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)]',
            className,
          )}
          {...props}
        />
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

Textarea.displayName = 'Textarea'
export { Textarea }
