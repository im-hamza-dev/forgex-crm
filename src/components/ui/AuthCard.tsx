import { cn } from '@/lib/utils'

interface AuthCardProps {
  children: React.ReactNode
  className?: string
}

export function AuthCard({ children, className }: AuthCardProps) {
  return (
    <div
      className={cn(
        'w-full rounded-2xl p-8',
        'bg-[var(--color-surface)]',
        'shadow-[0_4px_24px_rgba(26,16,8,0.08),0_1px_4px_rgba(26,16,8,0.04)]',
        className,
      )}
    >
      {children}
    </div>
  )
}
