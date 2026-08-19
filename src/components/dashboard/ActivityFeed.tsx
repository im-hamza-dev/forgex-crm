import { cn } from '@/lib/utils'

interface ActivityItem {
  text: string
  time: string
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-heading)]">
          Recent Activity
        </h3>
      </div>

      <div className="flex flex-col">
        {items.map((item, i) => (
          <div
            key={`${item.text}-${item.time}-${i}`}
            className={cn(
              'flex items-start gap-2.5 py-3',
              i < items.length - 1 && 'border-b border-[var(--color-border)]',
            )}
          >
            <div className="w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 bg-[var(--color-accent)]" />
            <p className="flex-1 text-[13px] leading-snug text-[var(--color-text-body)]">
              {item.text}
            </p>
            <span className="text-[11px] shrink-0 whitespace-nowrap text-[var(--color-text-muted)]">
              {item.time}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
