'use client'

import { forwardRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface SelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
  hint?: string
  options: { value: string; label: string; disabled?: boolean }[]
  placeholder?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, error, hint, options, placeholder, className, id, ...props }, ref) => {
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
        <div className="relative">
          <select
            ref={ref}
            id={inputId}
            className={cn(
              'h-[40px] w-full appearance-none rounded-[var(--radius-md)]',
              'border border-[var(--color-border)]',
              'bg-[var(--color-surface)]',
              'px-3 pr-9 text-[14px] text-[var(--color-text-body)]',
              'transition-colors duration-150',
              'outline-none cursor-pointer',
              'focus:border-[var(--color-border-focus)]',
              'focus:ring-2 focus:ring-[var(--color-accent)] focus:ring-opacity-15',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              error && 'border-[var(--color-danger)]',
              className,
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled}>
                {opt.label}
              </option>
            ))}
          </select>
          <ChevronDown
            size={15}
            className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
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

Select.displayName = 'Select'
export { Select }
