'use client'

import { useRef, useState, type DragEvent } from 'react'
import { MoreHorizontal, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Dropdown, type DropdownItem } from '@/components/ui'
import { LeadCard, type LeadAssigneeOption } from './LeadCard'
import type { LeadStage } from '@/constants/lead-stages'
import type { Lead } from '@/types/leads'

interface KanbanColumnProps {
  stage: LeadStage
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onAddLead: (stage: string) => void
  teamMembers?: LeadAssigneeOption[]
  canAssign?: boolean
  canMoveLead?: (lead: Lead) => boolean
  draggingLeadId?: string | null
  isDropTarget?: boolean
  onAssign?: (lead: Lead, assignee: LeadAssigneeOption | null) => void
  onDragStartLead?: (lead: Lead) => void
  onDragEndLead?: () => void
  onDropLead?: (leadId: string, oldStage: string, newStage: string) => void
  onDragOverStage?: (stage: string | null) => void
}

export function KanbanColumn({
  stage,
  leads,
  onLeadClick,
  onAddLead,
  teamMembers,
  canAssign,
  canMoveLead,
  draggingLeadId,
  isDropTarget,
  onAssign,
  onDragStartLead,
  onDragEndLead,
  onDropLead,
  onDragOverStage,
}: KanbanColumnProps) {
  const [menuOpen, setMenuOpen] = useState(false)
  const dragCount = useRef(0)

  const menuItems: DropdownItem[] = [
    { label: 'Add lead to this stage', onClick: () => onAddLead(stage.value) },
  ]

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCount.current += 1
    onDragOverStage?.(stage.value)
  }

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCount.current -= 1
    if (dragCount.current <= 0) {
      dragCount.current = 0
      onDragOverStage?.(null)
    }
  }

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    dragCount.current = 0
    onDragOverStage?.(null)
    try {
      const raw = e.dataTransfer.getData('text/plain')
      const parsed = JSON.parse(raw) as { leadId?: string; oldStage?: string }
      if (!parsed.leadId || !parsed.oldStage) return
      onDropLead?.(parsed.leadId, parsed.oldStage, stage.value)
    } catch {
      /* ignore invalid payloads */
    }
  }

  return (
    <div
      className="flex flex-col min-w-[240px] w-[240px] flex-shrink-0"
      onDragEnter={handleDragEnter}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center gap-2 mb-2 px-1 min-w-0">
        <span className="text-[13px] font-semibold truncate text-[var(--color-text-heading)]">
          {stage.label}
        </span>

        <span
          className="inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-semibold shrink-0"
          style={{
            background: stage.colorBg,
            color: stage.colorText,
          }}
        >
          {leads.length}
        </span>

        <div className="relative ml-auto shrink-0">
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

      <div
        className={cn(
          'flex flex-col gap-2 flex-1 min-h-[120px] rounded-[10px] p-1 -mx-1',
          'transition-colors duration-150',
          isDropTarget && 'bg-[var(--color-accent-subtle)] ring-1 ring-[var(--color-accent-border)]',
        )}
      >
        {leads.map((lead) => (
          <LeadCard
            key={lead.id}
            lead={lead}
            onClick={() => onLeadClick(lead)}
            teamMembers={teamMembers}
            canAssign={canAssign}
            canMove={canMoveLead?.(lead) ?? false}
            isDragging={draggingLeadId === lead.id}
            onAssign={onAssign}
            onDragStartLead={onDragStartLead}
            onDragEndLead={onDragEndLead}
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
