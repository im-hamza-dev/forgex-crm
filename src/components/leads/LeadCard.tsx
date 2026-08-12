'use client'

import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { getStage } from '@/constants/lead-stages'
import type { Lead } from '@/types/leads'

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
}

const PRIORITY_COLORS: Record<string, string> = {
  hot:  '#8B1A1A',
  warm: '#8B5E00',
  cold: '#1A3D6B',
}

const SERVICE_LABELS: Record<string, string> = {
  saas_mvp:             'SaaS MVP',
  workflow_automation:  'Workflow Automation',
  custom_crm:           'Custom CRM',
  ai_agents:            'AI Agents',
  tech_retainer:        'Tech Retainer',
  other:                'Other',
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const day = dateStr.split('T')[0] ?? dateStr
  const today = new Date()
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
  return day < todayStr
}

export function LeadCard({ lead, onClick }: LeadCardProps) {
  const stage = getStage(lead.stage)
  const priorityColor = PRIORITY_COLORS[lead.priority] ?? '#8B5E00'
  const overdue = isOverdue(lead.next_follow_up)

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null
    return dateStr.split('T')[0] ?? dateStr
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'relative w-full text-left',
        'bg-[var(--color-surface)]',
        'border border-[var(--color-border)]',
        'rounded-[10px]',
        'px-4 py-3.5',
        'cursor-pointer select-none',
        'transition-shadow duration-150',
        'hover:shadow-[0_2px_8px_rgba(26,16,8,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--color-accent)]',
      )}
      style={{
        borderLeft: `3px solid ${stage.color}`,
      }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-[14px] font-semibold leading-snug text-[var(--color-text-heading)]">
          {lead.company ?? lead.contact_name}
        </span>
        <span
          className="w-2 h-2 rounded-full shrink-0 mt-1"
          style={{ background: priorityColor }}
          aria-label={`${lead.priority} priority`}
        />
      </div>

      <p className="text-[13px] mb-2.5 text-[var(--color-text-secondary)]">
        {lead.contact_name}
      </p>

      <div className="flex items-center justify-between gap-2 mb-3">
        {lead.service_interest && (
          <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium truncate max-w-[120px] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]">
            {SERVICE_LABELS[lead.service_interest] ?? lead.service_interest}
          </span>
        )}
        {lead.budget_range && (
          <span className="text-[12px] shrink-0 text-[var(--color-text-muted)]">
            {lead.budget_range}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {lead.assignee_name ? (
            <Avatar
              name={lead.assignee_name}
              src={lead.assignee_avatar}
              size="xs"
            />
          ) : (
            <div
              className="w-6 h-6 rounded-full border border-dashed border-[var(--color-border-strong)]"
              aria-label="Unassigned"
            />
          )}
        </div>

        {lead.next_follow_up && (
          <span
            className={cn(
              'text-[11px] font-medium tabular-nums',
              overdue
                ? 'text-[var(--color-warning)]'
                : 'text-[var(--color-text-muted)]',
            )}
          >
            {formatDate(lead.next_follow_up)}
          </span>
        )}
      </div>
    </div>
  )
}
