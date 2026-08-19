'use client'

export interface PortalUpdateFull {
  id: string
  content: string
  date: string
  time: string
}

interface PortalUpdatesPageProps {
  updates: PortalUpdateFull[]
}

export function PortalUpdatesPage({ updates }: PortalUpdatesPageProps) {
  if (updates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
          style={{ background: 'var(--color-surface-hover)' }}
        >
          <span
            className="text-[16px] font-bold"
            style={{ color: 'var(--color-text-muted)' }}
          >
            F
          </span>
        </div>
        <p
          className="text-[16px] font-semibold mb-2"
          style={{ color: 'var(--color-text-body)' }}
        >
          No updates yet
        </p>
        <p
          className="text-[14px] max-w-[300px] leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
          The Forgex team will share project updates, progress notes, and
          announcements here.
        </p>
      </div>
    )
  }

  return (
    <div className="max-w-[680px] mx-auto">
      <div className="mb-8">
        <h1
          className="text-[22px] sm:text-[26px] font-bold leading-tight"
          style={{
            color: 'var(--color-text-heading)',
            letterSpacing: '-0.02em',
          }}
        >
          Project Updates
        </h1>
        <p
          className="text-[14px] mt-1"
          style={{ color: 'var(--color-accent)' }}
        >
          All progress notes from the Forgex team
        </p>
      </div>

      <div className="flex flex-col">
        {updates.map((update, i) => (
          <div
            key={update.id}
            className="py-6"
            style={{
              borderBottom:
                i < updates.length - 1
                  ? '1px solid var(--color-border)'
                  : undefined,
            }}
          >
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="flex items-center gap-2.5">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-[14px] font-bold text-white shrink-0"
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
                className="text-[12px] shrink-0 text-right"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {update.date} · {update.time}
              </span>
            </div>

            <div className="pl-0 sm:pl-[52px]">
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: 'var(--color-text-body)' }}
              >
                {update.content}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
