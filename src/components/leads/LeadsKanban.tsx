'use client'

import { useEffect, useState } from 'react'
import { LEAD_STAGES } from '@/constants/lead-stages'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  useAssignLead,
  useUpdateLead,
  useUpdateLeadStage,
} from '@/hooks/useLeads'
import { canAssignLead, canMoveLead } from '@/lib/leads-permissions'
import { toast } from '@/components/ui'
import { KanbanColumn } from './KanbanColumn'
import type { LeadAssigneeOption } from './LeadCard'
import type { Lead, LeadStage } from '@/types/leads'

interface LeadsKanbanProps {
  leads: Lead[]
  onLeadClick: (lead: Lead) => void
  onAddLead: (stage: string) => void
}

export function LeadsKanban({
  leads,
  onLeadClick,
  onAddLead,
}: LeadsKanbanProps) {
  const { profile } = useAuth()
  const assignLead = useAssignLead()
  const updateLead = useUpdateLead()
  const updateStage = useUpdateLeadStage()
  const [teamMembers, setTeamMembers] = useState<LeadAssigneeOption[]>([])
  const [draggingLeadId, setDraggingLeadId] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)

  const canAssign = canAssignLead(profile)

  useEffect(() => {
    const supabase = createClient()
    void supabase
      .from('profiles')
      .select('id, full_name, avatar_url')
      .eq('is_active', true)
      .neq('role', 'client')
      .order('full_name', { ascending: true })
      .then(({ data }) => {
        setTeamMembers(
          (data ?? []).map((p) => ({
            id: p.id,
            name: p.full_name ?? p.id,
            avatar: p.avatar_url,
          })),
        )
      })
  }, [])

  const leadsByStage = LEAD_STAGES.reduce<Record<string, Lead[]>>(
    (acc, stage) => {
      acc[stage.value] = leads.filter((l) => l.stage === stage.value)
      return acc
    },
    {},
  )

  const handleAssign = async (
    lead: Lead,
    assignee: LeadAssigneeOption | null,
  ) => {
    try {
      if (!assignee) {
        await updateLead.mutateAsync({
          id: lead.id,
          data: { assigned_to: null },
        })
        toast.success('Lead unassigned')
        return
      }
      await assignLead.mutateAsync({
        id: lead.id,
        assigned_to: assignee.id,
        assignee_name: assignee.name,
        assignee_avatar: assignee.avatar,
      })
      toast.success(`Assigned to ${assignee.name}`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not update assignee')
    }
  }

  const handleDropLead = async (
    leadId: string,
    oldStage: string,
    newStage: string,
  ) => {
    if (oldStage === newStage) return
    const lead = leads.find((l) => l.id === leadId)
    if (!lead || !canMoveLead(profile, lead)) {
      toast.error('You cannot move this lead')
      return
    }
    try {
      await updateStage.mutateAsync({
        id: leadId,
        oldStage: oldStage as LeadStage,
        newStage: newStage as LeadStage,
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not move lead')
    }
  }

  return (
    <div className="flex gap-3 overflow-x-auto pb-4">
      {LEAD_STAGES.map((stage) => (
        <KanbanColumn
          key={stage.value}
          stage={stage}
          leads={leadsByStage[stage.value] ?? []}
          onLeadClick={onLeadClick}
          onAddLead={onAddLead}
          teamMembers={teamMembers}
          canAssign={canAssign}
          canMoveLead={(lead) => canMoveLead(profile, lead)}
          draggingLeadId={draggingLeadId}
          isDropTarget={overStage === stage.value && draggingLeadId !== null}
          onAssign={(lead, assignee) => {
            void handleAssign(lead, assignee)
          }}
          onDragStartLead={(lead) => setDraggingLeadId(lead.id)}
          onDragEndLead={() => {
            setDraggingLeadId(null)
            setOverStage(null)
          }}
          onDropLead={(leadId, oldStage, newStage) => {
            void handleDropLead(leadId, oldStage, newStage)
          }}
          onDragOverStage={setOverStage}
        />
      ))}
    </div>
  )
}
