'use client'

import { useRef, useEffect, useLayoutEffect, useState } from 'react'
import { createPortal } from 'react-dom'
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
  /** When set, the menu portals to document.body so overflow-hidden parents can't clip it. */
  anchorRef?: React.RefObject<HTMLElement | null>
}

export function Dropdown({
  open,
  onClose,
  items,
  align = 'right',
  className,
  anchorRef,
}: DropdownProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [coords, setCoords] = useState<{ top: number; left: number } | null>(
    null,
  )
  const portaled = anchorRef !== undefined

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as Node
      if (ref.current?.contains(target)) return
      if (anchorRef?.current?.contains(target)) return
      onClose()
    }
    if (open) document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open, onClose, anchorRef])

  useLayoutEffect(() => {
    if (!open || !anchorRef?.current) {
      setCoords(null)
      return
    }

    const updatePosition = () => {
      const anchor = anchorRef.current
      if (!anchor) return
      const rect = anchor.getBoundingClientRect()
      const menuWidth = ref.current?.offsetWidth ?? 180
      setCoords({
        top: rect.bottom + 4,
        left: align === 'right' ? rect.right - menuWidth : rect.left,
      })
    }

    updatePosition()
    const frame = requestAnimationFrame(updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, anchorRef, align, items.length])

  if (!open) return null

  const menu = (
    <div
      ref={ref}
      className={cn(
        'z-[150] py-1 min-w-[180px]',
        portaled ? 'fixed' : 'absolute mt-1',
        'bg-[var(--color-surface)] rounded-[var(--radius-lg)]',
        'border border-[var(--color-border)]',
        'shadow-[0_4px_16px_rgba(26,16,8,0.10),0_1px_4px_rgba(26,16,8,0.06)]',
        !portaled && (align === 'right' ? 'right-0' : 'left-0'),
        portaled && !coords && 'invisible',
        className,
      )}
      style={
        portaled && coords
          ? { top: coords.top, left: coords.left }
          : undefined
      }
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

  if (portaled && typeof document !== 'undefined') {
    return createPortal(menu, document.body)
  }

  return menu
}
