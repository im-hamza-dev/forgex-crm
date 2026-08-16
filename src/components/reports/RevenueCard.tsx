import type { RevenueData } from '@/server/reports/reports.server'

interface RevenueCardProps {
  data: RevenueData
}

const variantColors = {
  success: 'var(--color-success)',
  danger: 'var(--color-danger)',
  muted: 'var(--color-text-muted)',
}

export function RevenueCard({ data }: RevenueCardProps) {
  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)] p-5"
      style={{ borderColor: 'var(--color-border)', flex: 1 }}
    >
      <p className="text-[14px] font-semibold mb-3" style={{ color: 'var(--color-text-heading)' }}>
        Revenue
      </p>

      <p className="text-[32px] font-bold leading-none mb-1" style={{ color: 'var(--color-accent)' }}>
        ${data.wonAmount.toLocaleString()}
      </p>

      <p className="text-[13px] font-medium mb-5" style={{ color: variantColors[data.changeVariant] }}>
        {data.changeVsLastMonth}
      </p>

      <div>
        <div className="flex h-[8px] rounded-full overflow-hidden mb-2">
          <div
            className="rounded-l-full"
            style={{ width: `${data.wonPct}%`, background: 'var(--color-success)' }}
          />
          <div className="rounded-r-full flex-1" style={{ background: 'var(--color-danger)' }} />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Won (${data.wonAmount > 0 ? `${Math.round(data.wonAmount / 1000)}k` : '0'})
          </span>
          <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
            Lost (${data.lostAmount.toLocaleString()})
          </span>
        </div>
      </div>
    </div>
  )
}
