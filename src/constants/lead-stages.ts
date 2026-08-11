export const LEAD_STAGES = [
  { value: 'new_lead',       label: 'New Lead',       color: '#888888' },
  { value: 'contacted',      label: 'Contacted',      color: '#3B82F6' },
  { value: 'qualified',      label: 'Qualified',      color: '#F59E0B' },
  { value: 'proposal_sent',  label: 'Proposal Sent',  color: '#8B5CF6' },
  { value: 'negotiation',    label: 'Negotiation',    color: '#EC4899' },
  { value: 'won',            label: 'Won',            color: '#22C55E' },
  { value: 'lost',           label: 'Lost',           color: '#FF4D4D' },
] as const

export type LeadStage = typeof LEAD_STAGES[number]['value']
