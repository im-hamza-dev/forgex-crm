'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils'

export interface AvatarProps {
  src?: string | null
  name?: string | null
  size?: 'xs' | 'sm' | 'md' | 'lg'
  className?: string
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[9px]',
  sm: 'w-8 h-8 text-[11px]',
  md: 'w-10 h-10 text-[13px]',
  lg: 'w-12 h-12 text-[15px]',
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  const parts = name.trim().split(' ')
  if (parts.length === 1) return parts[0]!.charAt(0).toUpperCase()
  return (
    parts[0]!.charAt(0).toUpperCase() +
    parts[parts.length - 1]!.charAt(0).toUpperCase()
  )
}

function InitialsFallback({
  name,
  size,
  className,
  initials,
}: {
  name?: string | null
  size: keyof typeof sizeClasses
  className?: string
  initials: string
}) {
  return (
    <div
      className={cn(
        'rounded-full flex-shrink-0 flex items-center justify-center',
        'bg-[var(--color-accent)] text-white font-semibold font-inter',
        sizeClasses[size],
        className,
      )}
      aria-label={name ?? 'User avatar'}
    >
      {initials}
    </div>
  )
}

export function Avatar({ src, name, size = 'sm', className }: AvatarProps) {
  const initials = getInitials(name)
  const [failed, setFailed] = useState(false)
  const trimmedSrc = src?.trim() || null

  useEffect(() => {
    setFailed(false)
  }, [trimmedSrc])

  if (trimmedSrc && !failed) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={trimmedSrc}
        alt={name ?? 'Avatar'}
        onError={() => setFailed(true)}
        className={cn(
          'rounded-full object-cover flex-shrink-0',
          sizeClasses[size],
          className,
        )}
      />
    )
  }

  return (
    <InitialsFallback
      name={name}
      size={size}
      className={className}
      initials={initials}
    />
  )
}
