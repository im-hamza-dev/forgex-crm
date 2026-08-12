export type Priority = 'hot' | 'warm' | 'cold'
export type LeadStatus = 'active' | 'won' | 'lost' | 'archived'

export interface Lead {
  id: string
  contact_name: string
  company: string | null
  email: string | null
  phone: string | null
  linkedin_url: string | null
  source: string
  service_interest: string | null
  budget_range: string | null
  tags: string[]
  stage: string
  status: LeadStatus
  priority: Priority
  lead_score: number | null
  assigned_to: string | null
  assignee_name: string | null
  assignee_avatar: string | null
  last_contacted_at: string | null
  next_follow_up: string | null
  created_at: string
  updated_at: string
}
