'use client'

import { useEffect, useCallback } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface DrawerProps {
  open: boolean
  onClose: () => void
  title?: string
  width?: number
  children: React.ReactNode
  className?: string
}

export function Drawer({ open, onClose, title, width = 480, children, className }: DrawerProps) {
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose],
  )

  useEffect(() => {
    if (open) {
      document.addEventListener('keydown', handleKeyDown)
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [open, handleKeyDown])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-[var(--color-overlay-drawer)]"
        onClick={onClose}
      />

      {/* Panel */}
      <div
        style={{ width }}
        className={cn(
          'relative z-10 h-full flex flex-col',
          'bg-[var(--color-surface)]',
          'border-l border-[var(--color-border)]',
          'shadow-[-8px_0_32px_rgba(26,16,8,0.08)]',
          className,
        )}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 h-[56px] border-b border-[var(--color-border)] shrink-0">
          <button
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-[var(--radius-md)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-body)] transition-colors"
            aria-label="Close drawer"
          >
            <X size={16} />
          </button>
          {title && (
            <h2 className="text-[15px] font-semibold text-[var(--color-text-heading)]">
              {title}
            </h2>
          )}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}
