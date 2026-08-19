'use client'

export interface PortalUpdate {
  id: string
  content: string
  date: string
}

interface PortalRecentUpdatesProps {
  updates: PortalUpdate[]
  onViewAll?: () => void
}

export function PortalRecentUpdates({
  updates,
  onViewAll,
}: PortalRecentUpdatesProps) {
  if (updates.length === 0) {
    return (
      <div
        className="rounded-xl border p-8 flex flex-col items-center text-center"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center mb-3"
          style={{ background: 'var(--color-surface-hover)' }}
        >
          <span
            className="text-[13px] font-bold"
            style={{ color: 'var(--color-text-muted)' }}
          >
            F
          </span>
        </div>
        <p
          className="text-[14px] font-medium mb-1"
          style={{ color: 'var(--color-text-body)' }}
        >
          No updates yet
        </p>
        <p
          className="text-[13px] max-w-[280px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          We&apos;ll post progress updates here as your project moves forward.
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <h3
          className="text-[15px] font-semibold"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Recent Updates
        </h3>
        {onViewAll && (
          <button
            type="button"
            onClick={onViewAll}
            className="text-[13px] font-medium hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            View all →
          </button>
        )}
      </div>

      <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
        {updates.map((update) => (
          <div key={update.id} className="px-4 sm:px-6 py-5">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0"
                  style={{ background: 'var(--color-accent)' }}
                >
                  F
                </div>
                <span
                  className="text-[14px] font-semibold"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  Forgex Team
                </span>
              </div>
              <span
                className="text-[12px] shrink-0"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {update.date}
              </span>
            </div>

            <p
              className="text-[14px] leading-relaxed"
              style={{ color: 'var(--color-text-body)' }}
            >
              {update.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
