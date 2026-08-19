'use client'

interface QuickStat {
  value: number | string
  label: string
  variant?: 'default' | 'warning' | 'danger'
}

interface PortalProjectHeroProps {
  projectName: string
  status: string
  serviceType: string
  startDate: string
  deadline: string
  completionPct: number
  nextMilestone?: { title: string; date: string } | null
  stats: QuickStat[]
}

const STATUS_BADGE: Record<string, { bg: string; text: string }> = {
  discovery: { bg: '#F5F5F5', text: '#6B6B6B' },
  in_progress: { bg: '#EEF3FA', text: '#1A3D6B' },
  review: { bg: '#FEF7E6', text: '#8B5E00' },
  delivered: { bg: '#EDF5ED', text: '#2D6A2D' },
  retainer: { bg: '#F5EDE6', text: '#9c6644' },
  on_hold: { bg: '#F5F5F5', text: '#6B6B6B' },
  cancelled: { bg: '#FDF0F0', text: '#8B1A1A' },
}

function formatStatus(s: string) {
  return s.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

function ProgressRing({ pct }: { pct: number }) {
  const size = 140
  const strokeWidth = 10
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (pct / 100) * circumference

  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#F0F0F0"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#9c6644"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
      </svg>
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ transform: 'none' }}
      >
        <span
          className="text-[28px] font-bold leading-none"
          style={{ color: 'var(--color-text-heading)', letterSpacing: '-0.03em' }}
        >
          {pct}%
        </span>
        <span
          className="text-[12px] mt-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          complete
        </span>
      </div>
    </div>
  )
}

export function PortalProjectHero({
  projectName,
  status,
  serviceType,
  startDate,
  deadline,
  completionPct,
  nextMilestone,
  stats,
}: PortalProjectHeroProps) {
  const badge = STATUS_BADGE[status] ?? STATUS_BADGE.in_progress!

  return (
    <div
      className="rounded-xl border p-4 sm:p-8"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <div className="flex flex-col-reverse md:flex-row md:items-start gap-6 md:gap-8">
        <div className="flex-1 min-w-0">
          <h1
            className="text-[22px] sm:text-[28px] font-bold leading-tight mb-3"
            style={{
              color: 'var(--color-text-heading)',
              letterSpacing: '-0.02em',
            }}
          >
            {projectName}
          </h1>

          <div className="flex items-center gap-2 mb-4">
            <span
              className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
              style={{ background: badge.bg, color: badge.text }}
            >
              {formatStatus(status)}
            </span>
            <span
              className="text-[11px] font-medium px-2.5 py-1 rounded-full"
              style={{
                background: 'var(--color-surface-hover)',
                color: 'var(--color-text-secondary)',
              }}
            >
              {serviceType}
            </span>
          </div>

          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span
              className="flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md font-medium"
              style={{
                background: 'var(--color-surface-hover)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {startDate}
            </span>
            <span style={{ color: 'var(--color-text-muted)' }}>→</span>
            <span
              className="flex items-center gap-1.5 text-[12px] px-2.5 py-1 rounded-md font-medium"
              style={{
                background: 'var(--color-surface-hover)',
                color: 'var(--color-text-secondary)',
                border: '1px solid var(--color-border)',
              }}
            >
              {deadline}
            </span>
          </div>

          <div className="mb-2">
            <div className="flex items-center justify-between mb-1.5">
              <span
                className="text-[10px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Project Progress
              </span>
              <span
                className="text-[12px] font-semibold"
                style={{ color: 'var(--color-accent)' }}
              >
                {completionPct}%
              </span>
            </div>
            <div
              className="w-full h-[6px] rounded-full overflow-hidden"
              style={{ background: '#F0F0F0' }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${completionPct}%`,
                  background: 'var(--color-accent)',
                }}
              />
            </div>
          </div>

          {nextMilestone && (
            <p className="text-[12px] mt-2" style={{ color: 'var(--color-text-muted)' }}>
              Next milestone:{' '}
              <span style={{ color: 'var(--color-accent)' }}>
                {nextMilestone.title}
              </span>
              {' '}— {nextMilestone.date}
            </p>
          )}

          <div
            className="flex items-stretch gap-0 mt-6 pt-5 overflow-x-auto"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="flex-1 min-w-[88px] flex flex-col gap-0.5"
                style={{
                  borderRight:
                    i < stats.length - 1
                      ? '1px solid var(--color-border)'
                      : undefined,
                  paddingLeft: i > 0 ? '24px' : '0',
                  paddingRight: i < stats.length - 1 ? '24px' : '0',
                }}
              >
                <span
                  className="text-[20px] font-bold leading-none"
                  style={{
                    color:
                      stat.variant === 'warning'
                        ? '#8B5E00'
                        : stat.variant === 'danger'
                          ? 'var(--color-danger)'
                          : 'var(--color-text-heading)',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {stat.value}
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="hidden sm:flex items-center justify-center pt-0 md:pt-4 self-center">
          <ProgressRing pct={completionPct} />
        </div>
      </div>
    </div>
  )
}
