'use client'

import { PieChart, Pie, Cell } from 'recharts'
import type { LeadSource } from '@/server/reports/reports.server'

interface LeadSourcesChartProps {
  sources: LeadSource[]
}

export function LeadSourcesChart({ sources }: LeadSourcesChartProps) {
  const total = sources.reduce((s, d) => s + d.value, 0)

  if (sources.length === 0) {
    return (
      <div
        className="rounded-xl border bg-[var(--color-surface)] p-5 flex items-center justify-center"
        style={{ borderColor: 'var(--color-border)', flex: 1, minHeight: 140 }}
      >
        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>No lead data yet</p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)] p-5"
      style={{ borderColor: 'var(--color-border)', flex: 1 }}
    >
      <p className="text-[14px] font-semibold mb-4" style={{ color: 'var(--color-text-heading)' }}>
        Lead Sources
      </p>

      <div className="flex items-center gap-6">
        <div className="relative shrink-0">
          <PieChart width={100} height={100}>
            <Pie data={sources} cx={45} cy={45} innerRadius={30} outerRadius={45} paddingAngle={2} dataKey="value">
              {sources.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
          </PieChart>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-[16px] font-bold" style={{ color: 'var(--color-text-heading)' }}>
              {total}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          {sources.map((source) => (
            <div key={source.name} className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: source.color }} />
                <span className="text-[12px]" style={{ color: 'var(--color-text-body)' }}>{source.name}</span>
              </div>
              <span className="text-[12px] tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                {source.value} ({source.pct})
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
