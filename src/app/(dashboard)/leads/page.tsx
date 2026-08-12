'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DashboardShell } from '@/components/layout'
import { Button } from '@/components/ui'
import {
  LeadsKanban,
  LeadsToolbar,
  LeadsTable,
  LeadDrawer,
  NewLeadModal,
  type LeadsView,
} from '@/components/leads'
import type { Lead } from '@/types/leads'

const MOCK_LEADS: Lead[] = [
  {
    id: '1',
    contact_name: 'David Reyes',
    company: 'ClinicOS',
    email: 'david@clinicos.io',
    phone: '+1 555 0105',
    linkedin_url: null,
    source: 'website_form',
    service_interest: 'custom_crm',
    budget_range: '$10k–$20k',
    tags: ['healthcare'],
    stage: 'new_lead',
    status: 'active',
    priority: 'cold',
    lead_score: 3,
    assigned_to: null,
    assignee_name: null,
    assignee_avatar: null,
    last_contacted_at: null,
    next_follow_up: '2026-08-20',
    created_at: '2026-08-10T00:00:00Z',
    updated_at: '2026-08-10T00:00:00Z',
  },
  {
    id: '2',
    contact_name: 'Priya Sharma',
    company: 'GrowthOS',
    email: 'priya@growthos.io',
    phone: null,
    linkedin_url: null,
    source: 'referral',
    service_interest: 'workflow_automation',
    budget_range: '$5k–$10k',
    tags: [],
    stage: 'contacted',
    status: 'active',
    priority: 'warm',
    lead_score: 6,
    assigned_to: 'user-zm',
    assignee_name: 'Zain Malik',
    assignee_avatar: null,
    last_contacted_at: '2026-08-07T00:00:00Z',
    next_follow_up: '2026-08-15',
    created_at: '2026-08-08T00:00:00Z',
    updated_at: '2026-08-12T00:00:00Z',
  },
  {
    id: '3',
    contact_name: 'Sarah Chen',
    company: 'Acme Health Co',
    email: 'sarah@acmehealth.com',
    phone: null,
    linkedin_url: null,
    source: 'cold_outreach',
    service_interest: 'custom_crm',
    budget_range: '$10k–$20k',
    tags: ['HealthTech'],
    stage: 'qualified',
    status: 'active',
    priority: 'hot',
    lead_score: 8,
    assigned_to: 'user-sa',
    assignee_name: 'Sara Ahmed',
    assignee_avatar: null,
    last_contacted_at: '2026-08-09T00:00:00Z',
    next_follow_up: '2026-08-13',
    created_at: '2026-08-01T00:00:00Z',
    updated_at: '2026-08-13T00:00:00Z',
  },
  {
    id: '4',
    contact_name: 'Marcus Webb',
    company: 'PayFlow SaaS',
    email: 'marcus@payflowsaas.com',
    phone: null,
    linkedin_url: null,
    source: 'social',
    service_interest: 'saas_mvp',
    budget_range: '$20k–$50k',
    tags: ['FinTech'],
    stage: 'proposal_sent',
    status: 'active',
    priority: 'hot',
    lead_score: 9,
    assigned_to: 'user-hi',
    assignee_name: 'Hamza Iqbal',
    assignee_avatar: null,
    last_contacted_at: '2026-08-08T00:00:00Z',
    next_follow_up: '2026-08-11',
    created_at: '2026-07-28T00:00:00Z',
    updated_at: '2026-08-11T00:00:00Z',
  },
  {
    id: '5',
    contact_name: 'James Okafor',
    company: 'NovaBuild',
    email: 'james@novabuild.dev',
    phone: null,
    linkedin_url: null,
    source: 'referral',
    service_interest: 'ai_agents',
    budget_range: '$50k+',
    tags: [],
    stage: 'negotiation',
    status: 'active',
    priority: 'hot',
    lead_score: 9,
    assigned_to: 'user-hi',
    assignee_name: 'Hamza Iqbal',
    assignee_avatar: null,
    last_contacted_at: '2026-08-10T00:00:00Z',
    next_follow_up: '2026-08-12',
    created_at: '2026-07-20T00:00:00Z',
    updated_at: '2026-08-12T00:00:00Z',
  },
]

export default function LeadsPage() {
  const [view, setView] = useState<LeadsView>('kanban')
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStage, setModalStage] = useState('new_lead')
  const [searchQuery, setSearchQuery] = useState('')

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead)
    setDrawerOpen(true)
  }

  const handleAddLead = (stage: string) => {
    setModalStage(stage)
    setModalOpen(true)
  }

  return (
    <DashboardShell title="Leads" notificationCount={3}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <LeadsToolbar
          view={view}
          onViewChange={setView}
          onFilter={() => {}}
        />
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={15} />}
          onClick={() => {
            setModalStage('new_lead')
            setModalOpen(true)
          }}
          className="rounded-lg shrink-0"
        >
          New Lead
        </Button>
      </div>

      {view === 'kanban' && (
        <LeadsKanban
          leads={MOCK_LEADS}
          onLeadClick={handleLeadClick}
          onAddLead={handleAddLead}
        />
      )}

      {view === 'list' && (
        <LeadsTable
          leads={MOCK_LEADS}
          onLeadClick={handleLeadClick}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      <LeadDrawer
        lead={selectedLead}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedLead(null)
        }}
        onEdit={(lead) => console.log('Edit lead:', lead.id)}
        onConvert={(lead) => console.log('Convert lead:', lead.id)}
      />

      <NewLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultStage={modalStage}
        onSubmit={(values) => console.log('Create lead:', values)}
      />
    </DashboardShell>
  )
}
