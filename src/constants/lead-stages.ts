export interface LeadStage {
  value: string
  label: string
  color: string
  colorBg: string
  colorText: string
}

export const LEAD_STAGES: LeadStage[] = [
  {
    value: 'new_lead',
    label: 'New Lead',
    color:     '#9CA3AF',
    colorBg:   '#F5F5F5',
    colorText: '#6B6B6B',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    color:     '#1A3D6B',
    colorBg:   '#EEF3FA',
    colorText: '#1A3D6B',
  },
  {
    value: 'qualified',
    label: 'Qualified',
    color:     '#4A1D6B',
    colorBg:   '#F3EEF8',
    colorText: '#4A1D6B',
  },
  {
    value: 'proposal_sent',
    label: 'Proposal Sent',
    color:     '#8B5E00',
    colorBg:   '#FEF7E6',
    colorText: '#8B5E00',
  },
  {
    value: 'negotiation',
    label: 'Negotiation',
    color:     '#7A2D5C',
    colorBg:   '#F8EEF4',
    colorText: '#7A2D5C',
  },
  {
    value: 'won',
    label: 'Won',
    color:     '#2D6A2D',
    colorBg:   '#EDF5ED',
    colorText: '#2D6A2D',
  },
  {
    value: 'lost',
    label: 'Lost',
    color:     '#8B1A1A',
    colorBg:   '#FDF0F0',
    colorText: '#8B1A1A',
  },
]

export type LeadStageValue = typeof LEAD_STAGES[number]['value']

export function getStage(value: string): LeadStage {
  return LEAD_STAGES.find((s) => s.value === value) ?? LEAD_STAGES[0]!
}
