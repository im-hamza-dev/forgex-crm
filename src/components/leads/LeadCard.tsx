'use client'

import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { getStage } from '@/constants/lead-stages'
import type { Lead } from '@/types/leads'

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
}

const PRIORITY_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  hot: {
    bg: 'var(--color-danger-bg)',
    text: 'var(--color-danger)',
    label: 'Hot',
  },
  warm: {
    bg: 'var(--color-warning-bg)',
    text: 'var(--color-warning)',
    label: 'Warm',
  },
  cold: {
    bg: 'var(--color-accent-subtle)',
    text: 'var(--color-text-secondary)',
    label: 'Cold',
  },
}

const SOURCE_LABELS: Record<string, string> = {
  website_form: 'Website',
  referral: 'Referral',
  cold_outreach: 'Cold outreach',
  social: 'Social',
  other: 'Other',
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
  const priority = PRIORITY_STYLES[lead.priority] ?? PRIORITY_STYLES.warm!
  const overdue = isOverdue(lead.next_follow_up)
  const assigneeName =
    lead.assignee_name ?? lead.assigned_profile?.full_name ?? null
  const assigneeAvatar =
    lead.assignee_avatar ?? lead.assigned_profile?.avatar_url ?? null

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
      style={{ borderLeft: `3px solid ${stage.color}` }}
    >
      <div className="flex items-start justify-between gap-2 mb-1">
        <span className="text-[14px] font-semibold leading-snug text-[var(--color-text-heading)]">
          {lead.contact_name}
        </span>
        <span
          className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: priority.bg, color: priority.text }}
        >
          {priority.label}
        </span>
      </div>

      <p className="text-[13px] mb-2 text-[var(--color-text-muted)]">
        {lead.company ?? '—'}
      </p>

      <div className="flex items-center flex-wrap gap-1.5 mb-3">
        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)]">
          {SOURCE_LABELS[lead.source] ?? lead.source}
        </span>
        {lead.lead_score != null && (
          <span className="text-[11px] text-[var(--color-text-muted)]">
            Score: {lead.lead_score}/10
          </span>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {assigneeName ? (
            <Avatar name={assigneeName} src={assigneeAvatar} size="xs" />
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
            {lead.next_follow_up.split('T')[0]}
          </span>
        )}
      </div>
    </div>
  )
}
