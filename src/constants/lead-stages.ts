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
    color:     'var(--color-stage-new-dot)',
    colorBg:   'var(--color-stage-new-bg)',
    colorText: 'var(--color-stage-new)',
  },
  {
    value: 'contacted',
    label: 'Contacted',
    color:     'var(--color-stage-contacted)',
    colorBg:   'var(--color-stage-contacted-bg)',
    colorText: 'var(--color-stage-contacted)',
  },
  {
    value: 'qualified',
    label: 'Qualified',
    color:     'var(--color-stage-qualified)',
    colorBg:   'var(--color-stage-qualified-bg)',
    colorText: 'var(--color-stage-qualified)',
  },
  {
    value: 'proposal_sent',
    label: 'Proposal Sent',
    color:     'var(--color-stage-proposal)',
    colorBg:   'var(--color-stage-proposal-bg)',
    colorText: 'var(--color-stage-proposal)',
  },
  {
    value: 'negotiation',
    label: 'Negotiation',
    color:     'var(--color-stage-negotiation)',
    colorBg:   'var(--color-stage-negotiation-bg)',
    colorText: 'var(--color-stage-negotiation)',
  },
  {
    value: 'won',
    label: 'Won',
    color:     'var(--color-stage-won)',
    colorBg:   'var(--color-stage-won-bg)',
    colorText: 'var(--color-stage-won)',
  },
  {
    value: 'lost',
    label: 'Lost',
    color:     'var(--color-stage-lost)',
    colorBg:   'var(--color-stage-lost-bg)',
    colorText: 'var(--color-stage-lost)',
  },
]

export type LeadStageValue = typeof LEAD_STAGES[number]['value']

export function getStage(value: string): LeadStage {
  return LEAD_STAGES.find((s) => s.value === value) ?? LEAD_STAGES[0]!
}
