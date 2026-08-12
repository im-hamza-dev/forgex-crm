import { cn } from '@/lib/utils'

export interface SkeletonProps {
  className?: string
  width?: string | number
  height?: string | number
  rounded?: 'sm' | 'md' | 'lg' | 'full'
}

const roundedClasses = {
  sm:   'rounded-[var(--radius-sm)]',
  md:   'rounded-[var(--radius-md)]',
  lg:   'rounded-[var(--radius-lg)]',
  full: 'rounded-full',
}

export function Skeleton({ className, width, height, rounded = 'md' }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[var(--color-border)]',
        roundedClasses[rounded],
        className,
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  )
}

// Preset skeletons for common patterns
export function SkeletonCard() {
  return (
    <div className="bg-[var(--color-surface)] rounded-[var(--radius-lg)] border border-[var(--color-border)] p-5 space-y-3">
      <Skeleton height={12} width="40%" />
      <Skeleton height={32} width="60%" />
      <Skeleton height={12} width="30%" />
    </div>
  )
}

export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 py-3">
      <Skeleton width={32} height={32} rounded="full" />
      <div className="flex-1 space-y-2">
        <Skeleton height={12} width="50%" />
        <Skeleton height={10} width="30%" />
      </div>
      <Skeleton height={22} width={60} rounded="full" />
    </div>
  )
}
