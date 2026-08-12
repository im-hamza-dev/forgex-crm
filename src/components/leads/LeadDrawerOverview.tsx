'use client'

import { Copy } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Lead } from '@/types/leads'

function ScoreDots({ score }: { score: number | null }) {
  return (
    <div className="flex items-center gap-0.5 mt-0.5">
      {Array.from({ length: 10 }).map((_, i) => (
        <span
          key={i}
          className={cn(
            'w-2 h-2 rounded-full',
            i < (score ?? 0)
              ? 'bg-[var(--color-accent)]'
              : 'bg-[var(--color-border-strong)]',
          )}
        />
      ))}
    </div>
  )
}

function Field({
  label,
  value,
  copyable = false,
  className,
}: {
  label: string
  value?: string | null
  copyable?: boolean
  className?: string
}) {
  const copy = () => {
    if (value) void navigator.clipboard.writeText(value)
  }

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">
        {label}
      </p>
      <div className="flex items-center gap-1.5">
        <p
          className={cn(
            'text-[13px]',
            value ? 'text-[var(--color-text-body)]' : 'text-[var(--color-text-muted)]',
          )}
        >
          {value ?? '—'}
        </p>
        {copyable && value && (
          <button
            type="button"
            onClick={copy}
            className="text-[var(--color-text-muted)] hover:text-[var(--color-text-body)] transition-colors"
            aria-label={`Copy ${label}`}
          >
            <Copy size={12} />
          </button>
        )}
      </div>
    </div>
  )
}

const SERVICE_LABELS: Record<string, string> = {
  saas_mvp:            'SaaS MVP',
  workflow_automation: 'Workflow Automation',
  custom_crm:          'Custom CRM',
  ai_agents:           'AI Agents',
  tech_retainer:       'Tech Retainer',
  other:               'Other',
}

const SOURCE_LABELS: Record<string, string> = {
  website_form:  'Website form',
  referral:      'Referral',
  cold_outreach: 'Cold outreach',
  social:        'Social media',
  other:         'Other',
}

interface LeadDrawerOverviewProps {
  lead: Lead
}

export function LeadDrawerOverview({ lead }: LeadDrawerOverviewProps) {
  return (
    <div className="p-5 flex flex-col gap-5">
      <Field label="Contact Name" value={lead.contact_name} />

      <div className="grid grid-cols-2 gap-4">
        <Field label="Email" value={lead.email} copyable />
        <Field label="Phone" value={lead.phone} copyable />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field
          label="Source"
          value={SOURCE_LABELS[lead.source] ?? lead.source}
        />
        <Field
          label="Service Interest"
          value={
            lead.service_interest
              ? SERVICE_LABELS[lead.service_interest] ?? lead.service_interest
              : null
          }
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Budget Range" value={lead.budget_range} />
        <div className="flex flex-col gap-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">
            Lead Score
          </p>
          <ScoreDots score={lead.lead_score} />
        </div>
      </div>

      <Field
        label="Assigned To"
        value={lead.assignee_name ?? 'Unassigned'}
      />

      <Field label="Next Follow-Up" value={lead.next_follow_up} />

      <Field
        label="Created"
        value={lead.created_at ? lead.created_at.split('T')[0] : null}
      />

      <div className="h-px bg-[var(--color-border)]" />

      <div className="flex flex-col gap-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]">
          Tags
        </p>
        <div className="flex flex-wrap gap-1.5">
          {lead.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
            >
              {tag}
            </span>
          ))}
          <button
            type="button"
            className="px-2.5 py-1 rounded-full text-[11px] font-medium border border-dashed border-[var(--color-border-strong)] text-[var(--color-text-muted)] transition-colors hover:bg-[var(--color-surface-hover)]"
          >
            + Add tag
          </button>
        </div>
      </div>
    </div>
  )
}
