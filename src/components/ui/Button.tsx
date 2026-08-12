'use client'

import { forwardRef } from 'react'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'ghost' | 'danger' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
  icon?: React.ReactNode
  iconPosition?: 'left' | 'right'
}

const variantClasses = {
  primary: [
    'bg-[var(--color-accent)] text-white',
    'hover:bg-[var(--color-accent-hover)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
    'focus-visible:ring-2 focus-visible:ring-[var(--color-accent)] focus-visible:ring-offset-2',
  ].join(' '),
  ghost: [
    'bg-transparent text-[var(--color-text-body)]',
    'border border-[var(--color-border)]',
    'hover:bg-[var(--color-surface-hover)] hover:border-[var(--color-border-strong)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  outline: [
    'bg-transparent text-[var(--color-accent)]',
    'border border-[var(--color-accent)]',
    'hover:bg-[var(--color-accent-subtle)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
  danger: [
    'bg-transparent text-[var(--color-danger)]',
    'border border-[var(--color-danger)]',
    'hover:bg-[var(--color-danger-bg)]',
    'disabled:opacity-50 disabled:cursor-not-allowed',
  ].join(' '),
}

const sizeClasses = {
  sm: 'h-[34px] px-3 text-[13px] font-medium gap-1.5 rounded-[var(--radius-md)]',
  md: 'h-[40px] px-4 text-[14px] font-medium gap-2 rounded-[var(--radius-md)]',
  lg: 'h-[44px] px-5 text-[15px] font-semibold gap-2 rounded-[var(--radius-md)]',
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      icon,
      iconPosition = 'left',
      className,
      children,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center',
          'font-inter transition-colors duration-150',
          'outline-none select-none',
          variantClasses[variant],
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        {loading ? (
          <Loader2 size={15} className="animate-spin" />
        ) : (
          <>
            {icon && iconPosition === 'left' && (
              <span className="shrink-0">{icon}</span>
            )}
            {children}
            {icon && iconPosition === 'right' && (
              <span className="shrink-0">{icon}</span>
            )}
          </>
        )}
      </button>
    )
  },
)

Button.displayName = 'Button'
export { Button }
