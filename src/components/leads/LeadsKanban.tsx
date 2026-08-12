'use client'

import { LEAD_STAGES } from '@/constants/lead-stages'
import { KanbanColumn } from './KanbanColumn'
import type { Lead } from '@/types/leads'

interface LeadsKanbanProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onAddLead: (stage: string) => void
}

export function LeadsKanban({ leads, onLeadClick, onAddLead }: LeadsKanbanProps) {
  const leadsByStage = LEAD_STAGES.reduce<Record<string, Lead[]>>(
    (acc, stage) => {
      acc[stage.value] = leads.filter((l) => l.stage === stage.value)
      return acc
    },
    {},
  )

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {LEAD_STAGES.map((stage) => (
        <KanbanColumn
          key={stage.value}
          stage={stage}
          leads={leadsByStage[stage.value] ?? []}
          onLeadClick={onLeadClick}
          onAddLead={onAddLead}
        />
      ))}
    </div>
  )
}
