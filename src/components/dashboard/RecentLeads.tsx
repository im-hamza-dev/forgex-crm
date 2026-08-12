import Link from 'next/link'
import { cn } from '@/lib/utils'
import { ROUTES } from '@/constants/routes'

const STAGE_CONFIG: Record<string, { text: string; bg: string; dot: string }> = {
  'New Lead': {
    text: 'text-[var(--color-stage-new)]',
    bg: 'bg-[var(--color-stage-new-bg)]',
    dot: 'bg-[var(--color-stage-new-dot)]',
  },
  Contacted: {
    text: 'text-[var(--color-stage-contacted)]',
    bg: 'bg-[var(--color-stage-contacted-bg)]',
    dot: 'bg-[var(--color-stage-contacted)]',
  },
  Qualified: {
    text: 'text-[var(--color-stage-qualified)]',
    bg: 'bg-[var(--color-stage-qualified-bg)]',
    dot: 'bg-[var(--color-stage-qualified)]',
  },
  'Proposal Sent': {
    text: 'text-[var(--color-stage-proposal)]',
    bg: 'bg-[var(--color-stage-proposal-bg)]',
    dot: 'bg-[var(--color-stage-proposal)]',
  },
  Negotiation: {
    text: 'text-[var(--color-stage-negotiation)]',
    bg: 'bg-[var(--color-stage-negotiation-bg)]',
    dot: 'bg-[var(--color-stage-negotiation)]',
  },
  Won: {
    text: 'text-[var(--color-stage-won)]',
    bg: 'bg-[var(--color-stage-won-bg)]',
    dot: 'bg-[var(--color-stage-won)]',
  },
  Lost: {
    text: 'text-[var(--color-stage-lost)]',
    bg: 'bg-[var(--color-stage-lost-bg)]',
    dot: 'bg-[var(--color-stage-lost)]',
  },
}

interface Lead {
  name: string
  company: string
  stage: string
  date: string
}

interface RecentLeadsProps {
  leads: Lead[]
}

export function RecentLeads({ leads }: RecentLeadsProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] flex flex-col">
      <div className="flex items-center justify-between px-5 pt-5 pb-4">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-heading)]">
          Recent Leads
        </h3>
        <Link
          href={ROUTES.LEADS}
          className="text-[13px] font-medium transition-opacity hover:opacity-70 text-[var(--color-accent)]"
        >
          View all →
        </Link>
      </div>

      <div className="flex-1 px-5">
        {leads.map((lead, i) => {
          const stage = STAGE_CONFIG[lead.stage] ?? STAGE_CONFIG['New Lead']!

          return (
            <div
              key={lead.name}
              className={cn(
                'flex items-center gap-3 py-3',
                i < leads.length - 1 && 'border-b border-[var(--color-border)]',
              )}
            >
              <div className={cn('w-2 h-2 rounded-full shrink-0', stage.dot)} />

              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-semibold truncate text-[var(--color-text-heading)]">
                  {lead.name}
                </p>
                <p className="text-[12px] truncate text-[var(--color-text-secondary)]">
                  {lead.company}
                </p>
              </div>

              <span
                className={cn(
                  'shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold',
                  stage.bg,
                  stage.text,
                )}
              >
                {lead.stage}
              </span>

              <span className="shrink-0 text-[12px] w-[82px] text-right tabular-nums text-[var(--color-text-muted)]">
                {lead.date}
              </span>
            </div>
          )
        })}
      </div>

      <div className="py-3.5 border-t border-[var(--color-border)] text-center">
        <Link
          href={ROUTES.LEADS}
          className="text-[13px] font-medium transition-opacity hover:opacity-70 text-[var(--color-accent)]"
        >
          View all leads →
        </Link>
      </div>
    </div>
  )
}
