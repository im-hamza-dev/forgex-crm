const WON_AMOUNT = 12000
const LOST_AMOUNT = 2000
const total = WON_AMOUNT + LOST_AMOUNT
const wonPct = Math.round((WON_AMOUNT / total) * 100)

export function RevenueCard() {
  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)] p-5"
      style={{ borderColor: 'var(--color-border)', flex: 1 }}
    >
      <p
        className="text-[14px] font-semibold mb-3"
        style={{ color: 'var(--color-text-heading)' }}
      >
        Revenue
      </p>

      <p
        className="text-[32px] font-bold leading-none mb-1"
        style={{ color: 'var(--color-accent)' }}
      >
        ${WON_AMOUNT.toLocaleString()}
      </p>

      <p
        className="text-[13px] font-medium mb-5"
        style={{ color: 'var(--color-success)' }}
      >
        ↑ 24% vs last month
      </p>

      <div>
        <div className="flex h-[8px] rounded-full overflow-hidden mb-2">
          <div
            className="rounded-l-full"
            style={{
              width: `${wonPct}%`,
              background: 'var(--color-success)',
            }}
          />
          <div
            className="rounded-r-full flex-1"
            style={{ background: 'var(--color-danger)' }}
          />
        </div>
        <div className="flex items-center justify-between">
          <span
            className="text-[11px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Won (${Math.round(WON_AMOUNT / 1000)}k)
          </span>
          <span
            className="text-[11px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Lost (${LOST_AMOUNT})
          </span>
        </div>
      </div>
    </div>
  )
}
