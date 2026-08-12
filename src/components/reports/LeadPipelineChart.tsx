const PIPELINE_STAGES = [
  { label: 'New Lead', count: 1, color: '#9CA3AF' },
  { label: 'Contacted', count: 1, color: '#1A3D6B' },
  { label: 'Qualified', count: 1, color: '#4A1D6B' },
  { label: 'Proposal Sent', count: 1, color: '#8B5E00' },
  { label: 'Negotiation', count: 1, color: '#7A2D5C' },
  { label: 'Won', count: 0, color: '#2D6A2D' },
  { label: 'Lost', count: 0, color: '#8B1A1A' },
]

const KPI_CHIPS = [
  { label: 'Avg. Days to Close', value: '14' },
  { label: 'Win Rate', value: '8%' },
  { label: 'Total Pipeline', value: '$148k' },
]

export function LeadPipelineChart() {
  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)] p-5"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <p
        className="text-[14px] font-semibold mb-5"
        style={{ color: 'var(--color-text-heading)' }}
      >
        Lead Pipeline
      </p>

      <div className="flex gap-1 mb-1">
        {PIPELINE_STAGES.map((stage) => (
          <div
            key={stage.label}
            className="flex-1 flex flex-col items-center gap-1"
          >
            <span
              className="text-[11px] font-medium tabular-nums"
              style={{
                color:
                  stage.count > 0
                    ? 'var(--color-text-secondary)'
                    : 'transparent',
              }}
            >
              {stage.count}
            </span>
            <div
              className="w-full h-[6px] rounded-full"
              style={{ background: 'var(--color-border)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: stage.count > 0 ? '100%' : '0%',
                  background: stage.color,
                }}
              />
            </div>
            <span
              className="text-[10px] text-center leading-tight"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {stage.label}
            </span>
          </div>
        ))}
      </div>

      <div
        className="flex items-center gap-6 mt-5 pt-4 border-t"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {KPI_CHIPS.map((chip) => (
          <div key={chip.label}>
            <p
              className="text-[10px] font-semibold uppercase tracking-[0.07em] mb-0.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {chip.label}
            </p>
            <p
              className="text-[18px] font-bold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {chip.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
