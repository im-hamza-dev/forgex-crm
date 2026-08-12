'use client'

import { useState } from 'react'
import { MoreHorizontal, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { getStage } from '@/constants/lead-stages'
import type { Lead } from '@/types/leads'

function ScoreDots({ score }: { score: number | null }) {
  const value = score ?? 0
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-2 h-2 rounded-full',
            i < value
              ? 'bg-[var(--color-accent)]'
              : 'bg-[var(--color-border-strong)]',
          )}
        />
      ))}
    </div>
  )
}

const PRIORITY_DOTS: Record<string, string> = {
  hot:  '#8B1A1A',
  warm: '#8B5E00',
  cold: '#1A3D6B',
}

const PRIORITY_LABELS: Record<string, string> = {
  hot:  'Hot',
  warm: 'Warm',
  cold: 'Cold',
}

interface LeadsTableProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  searchQuery: string
  onSearchChange: (q: string) => void
}

export function LeadsTable({
  leads,
  onLeadClick,
  searchQuery,
  onSearchChange,
}: LeadsTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const toggleAll = () => {
    if (selected.size === leads.length) setSelected(new Set())
    else setSelected(new Set(leads.map((l) => l.id)))
  }

  const toggleOne = (id: string) => {
    const next = new Set(selected)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setSelected(next)
  }

  const filtered = leads.filter((l) => {
    const q = searchQuery.toLowerCase()
    return (
      l.contact_name.toLowerCase().includes(q) ||
      (l.company ?? '').toLowerCase().includes(q) ||
      (l.email ?? '').toLowerCase().includes(q)
    )
  })

  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
        <input
          type="text"
          placeholder="Search leads..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className={cn(
            'h-[36px] w-[280px] px-3 rounded-lg text-[13px]',
            'border border-[var(--color-border)] outline-none transition-colors',
            'bg-[var(--color-surface)] text-[var(--color-text-body)]',
            'placeholder:text-[var(--color-text-muted)]',
            'focus:border-[var(--color-accent)]',
          )}
        />
        <button
          type="button"
          className={cn(
            'flex items-center gap-1.5 h-[36px] px-3 rounded-lg text-[13px]',
            'border border-[var(--color-border)] text-[var(--color-text-secondary)]',
            'transition-colors hover:bg-[var(--color-surface-hover)]',
          )}
        >
          <Upload size={13} />
          Export
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="w-10 pl-4 py-3">
                <input
                  type="checkbox"
                  checked={selected.size === leads.length && leads.length > 0}
                  onChange={toggleAll}
                  className="w-4 h-4 rounded accent-[var(--color-accent)]"
                  aria-label="Select all leads"
                />
              </th>
              {[
                { label: 'Contact / Company', cls: 'text-left' },
                { label: 'Stage', cls: 'text-left w-[140px]' },
                { label: 'Priority', cls: 'text-left w-[100px]' },
                { label: 'Assigned To', cls: 'text-left w-[140px]' },
                { label: 'Follow-Up', cls: 'text-left w-[110px]' },
                { label: 'Score', cls: 'text-left w-[140px]' },
                { label: 'Last Contact', cls: 'text-left w-[110px]' },
                { label: '', cls: 'w-10 pr-4' },
              ].map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]',
                    col.cls,
                  )}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((lead, i) => {
              const stage = getStage(lead.stage)
              const dotColor = PRIORITY_DOTS[lead.priority] ?? '#8B5E00'

              return (
                <tr
                  key={lead.id}
                  className={cn(
                    'group transition-colors hover:bg-[var(--color-surface-hover)] cursor-pointer',
                    i < filtered.length - 1 && 'border-b border-[var(--color-border)]',
                  )}
                  onClick={() => onLeadClick(lead)}
                >
                  <td className="pl-4 py-3.5 w-10" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selected.has(lead.id)}
                      onChange={() => toggleOne(lead.id)}
                      className="w-4 h-4 rounded accent-[var(--color-accent)]"
                      aria-label={`Select ${lead.contact_name}`}
                    />
                  </td>

                  <td className="py-3.5 pr-4">
                    <p className="text-[14px] font-semibold text-[var(--color-text-heading)]">
                      {lead.contact_name}
                    </p>
                    {lead.company && (
                      <p className="text-[12px] text-[var(--color-accent)]">
                        {lead.company}
                      </p>
                    )}
                  </td>

                  <td className="py-3.5 pr-4 w-[140px]">
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{
                        background: stage.colorBg,
                        color: stage.colorText,
                      }}
                    >
                      {stage.label}
                    </span>
                  </td>

                  <td className="py-3.5 pr-4 w-[100px]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full shrink-0"
                        style={{ background: dotColor }}
                      />
                      <span className="text-[13px] text-[var(--color-text-body)]">
                        {PRIORITY_LABELS[lead.priority]}
                      </span>
                    </span>
                  </td>

                  <td className="py-3.5 pr-4 w-[140px]">
                    {lead.assignee_name ? (
                      <span className="flex items-center gap-2">
                        <Avatar
                          name={lead.assignee_name}
                          src={lead.assignee_avatar}
                          size="xs"
                        />
                        <span className="text-[13px] text-[var(--color-text-body)]">
                          {lead.assignee_name.split(' ')[0]}
                        </span>
                      </span>
                    ) : (
                      <span className="text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>

                  <td className="py-3.5 pr-4 w-[110px]">
                    <span className="text-[12px] tabular-nums text-[var(--color-text-muted)]">
                      {lead.next_follow_up ?? '—'}
                    </span>
                  </td>

                  <td className="py-3.5 pr-4 w-[140px]">
                    <ScoreDots score={lead.lead_score} />
                  </td>

                  <td className="py-3.5 pr-4 w-[110px]">
                    <span className="text-[12px] tabular-nums text-[var(--color-text-muted)]">
                      {lead.last_contacted_at
                        ? lead.last_contacted_at.split('T')[0]
                        : '—'}
                    </span>
                  </td>

                  <td
                    className="pr-4 w-10"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className={cn(
                        'flex items-center justify-center w-7 h-7 rounded-lg',
                        'opacity-0 group-hover:opacity-100 transition-opacity',
                        'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]',
                      )}
                      aria-label="Lead actions"
                    >
                      <MoreHorizontal size={14} />
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center text-[var(--color-text-muted)]">
          <p className="text-[14px]">No leads match your search</p>
        </div>
      )}
    </div>
  )
}
