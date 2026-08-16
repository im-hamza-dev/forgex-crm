import type { PipelineStage, PipelineKpis } from '@/server/reports/reports.server'

interface LeadPipelineChartProps {
  stages: PipelineStage[]
  kpis: PipelineKpis
}

export function LeadPipelineChart({ stages, kpis }: LeadPipelineChartProps) {
  const maxCount = Math.max(...stages.map((s) => s.count), 1)

  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)] p-5"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <p className="text-[14px] font-semibold mb-5" style={{ color: 'var(--color-text-heading)' }}>
        Lead Pipeline
      </p>

      <div className="flex gap-1 mb-1">
        {stages.map((stage) => (
          <div key={stage.label} className="flex-1 flex flex-col items-center gap-1">
            <span
              className="text-[11px] font-medium tabular-nums"
              style={{ color: stage.count > 0 ? 'var(--color-text-secondary)' : 'transparent' }}
            >
              {stage.count}
            </span>
            <div className="w-full h-[6px] rounded-full" style={{ background: 'var(--color-border)' }}>
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${Math.round((stage.count / maxCount) * 100)}%`,
                  background: stage.color,
                }}
              />
            </div>
            <span className="text-[10px] text-center leading-tight" style={{ color: 'var(--color-text-muted)' }}>
              {stage.label}
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-6 mt-5 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
        {[
          { label: 'Avg. Days to Close', value: kpis.avgDaysToClose > 0 ? `${kpis.avgDaysToClose}d` : '—' },
          { label: 'Win Rate', value: kpis.winRate },
          { label: 'Total Pipeline', value: kpis.totalPipeline },
        ].map((chip) => (
          <div key={chip.label}>
            <p className="text-[10px] font-semibold uppercase tracking-[0.07em] mb-0.5" style={{ color: 'var(--color-text-muted)' }}>
              {chip.label}
            </p>
            <p className="text-[18px] font-bold" style={{ color: 'var(--color-text-heading)' }}>
              {chip.value}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
