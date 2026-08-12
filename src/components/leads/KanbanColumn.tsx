'use client'

import { useState } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dropdown, type DropdownItem } from '@/components/ui'
import { LeadCard } from './LeadCard'
import type { LeadStage } from '@/constants/lead-stages'
import type { Lead } from '@/types/leads'

interface KanbanColumnProps {
  stage: LeadStage
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onAddLead: (stage: string) => void
}

export function KanbanColumn({
  stage,
  leads,
  onLeadClick,
  onAddLead,
}: KanbanColumnProps) {
  const [menuOpen, setMenuOpen] = useState(false)

  const menuItems: DropdownItem[] = [
    { label: 'Add lead to this stage', onClick: () => onAddLead(stage.value) },
    { label: 'Filter by this stage', onClick: () => {} },
  ]

  return (
    <div className="flex flex-col min-w-[220px] w-[220px] flex-shrink-0">
      <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-[13px] font-semibold text-[var(--color-text-heading)]">
          {stage.label}
        </span>

        <span
          className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-semibold"
          style={{
            background: stage.colorBg,
            color: stage.colorText,
          }}
        >
          {leads.length}
        </span>

        <div className="relative ml-auto">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            className={cn(
              'flex items-center justify-center w-6 h-6 rounded',
              'text-[var(--color-text-muted)] transition-colors',
              'hover:bg-[var(--color-surface-hover)]',
              'hover:text-[var(--color-text-body)]',
            )}
            aria-label={`${stage.label} options`}
          >
            <MoreHorizontal size={14} />
          </button>
          <Dropdown
            open={menuOpen}
            onClose={() => setMenuOpen(false)}
            items={menuItems}
            align="right"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2 flex-1">
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => onLeadClick(lead)}
          />
        ))}
      </div>

      <button
        type="button"
        onClick={() => onAddLead(stage.value)}
        className={cn(
          'mt-2 w-full h-[36px] flex items-center justify-center gap-1.5',
          'border border-dashed border-[var(--color-border)] rounded-[8px]',
          'text-[13px] text-[var(--color-text-muted)] bg-transparent',
          'transition-colors',
          'hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-secondary)]',
          'focus-visible:outline-none focus-visible:ring-2',
          'focus-visible:ring-[var(--color-accent)]',
        )}
      >
        <Plus size={13} />
        Add lead
      </button>
    </div>
  )
}
