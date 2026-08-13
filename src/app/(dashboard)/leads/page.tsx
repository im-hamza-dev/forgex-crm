'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus } from 'lucide-react'
import { DashboardShell } from '@/components/layout'
import { Button, toast } from '@/components/ui'
import {
  LeadsKanban,
  LeadsToolbar,
  LeadsTable,
  LeadDrawer,
  NewLeadModal,
  type LeadsView,
} from '@/components/leads'
import { useAuth } from '@/hooks/useAuth'
import { useCreateLead, useDeleteLead, useLeads } from '@/hooks/useLeads'
import { canDeleteLead } from '@/lib/leads-permissions'
import type { Lead, LeadFilters } from '@/types/leads'

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

export default function LeadsPage() {
  const { profile } = useAuth()
  const [view, setView] = useState<LeadsView>('kanban')
  const [selectedLeadId, setSelectedLeadId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalStage, setModalStage] = useState('new_lead')
  const [searchQuery, setSearchQuery] = useState('')
  const [stageFilter, setStageFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const debouncedSearch = useDebouncedValue(searchQuery, 300)

  const filters: LeadFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      stage: stageFilter || undefined,
      priority: priorityFilter || undefined,
      status: statusFilter || undefined,
    }),
    [debouncedSearch, stageFilter, priorityFilter, statusFilter],
  )

  const { data: leads = [], isLoading, isError, error, refetch } =
    useLeads(filters)
  const createLead = useCreateLead()
  const deleteLead = useDeleteLead()

  const selectedLead =
    leads.find((l) => l.id === selectedLeadId) ?? null

  useEffect(() => {
    if (drawerOpen) {
      void refetch()
    }
  }, [drawerOpen, refetch])

  const handleLeadClick = (lead: Lead) => {
    setSelectedLeadId(lead.id)
    setDrawerOpen(true)
  }

  const handleAddLead = (stage: string) => {
    setModalStage(stage)
    setModalOpen(true)
  }

  const handleCreate = async (values: {
    contact_name: string
    company?: string
    email?: string
    phone?: string
    linkedin_url?: string
    source: string
    service_interest?: string
    budget_range?: string
    stage: string
    assigned_to?: string
    next_follow_up?: string
    priority: 'hot' | 'warm' | 'cold'
    tags: string[]
    lead_score: number | null
  }) => {
    try {
      await createLead.mutateAsync({
        contact_name: values.contact_name,
        company: values.company || null,
        email: values.email || null,
        phone: values.phone || null,
        linkedin_url: values.linkedin_url || null,
        source: values.source,
        service_interest: values.service_interest || null,
        budget_range: values.budget_range || null,
        stage: values.stage,
        assigned_to: values.assigned_to || null,
        next_follow_up: values.next_follow_up || null,
        priority: values.priority,
        tags: values.tags,
        lead_score: values.lead_score,
      })
      toast.success('Lead created')
      setModalOpen(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create lead')
    }
  }

  return (
    <DashboardShell title="Leads" notificationCount={0}>
      <div className="flex items-center justify-between gap-4 mb-4">
        <LeadsToolbar
          view={view}
          onViewChange={setView}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          stageFilter={stageFilter}
          onStageFilterChange={setStageFilter}
          priorityFilter={priorityFilter}
          onPriorityFilterChange={setPriorityFilter}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          filterActive={Boolean(
            stageFilter || priorityFilter || statusFilter || searchQuery,
          )}
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

      {isLoading && (
        <div className="grid grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div
              key={i}
              className="h-[280px] rounded-xl animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
            />
          ))}
        </div>
      )}

      {isError && (
        <p className="text-[14px] text-[var(--color-danger)]">
          {error instanceof Error ? error.message : 'Failed to load leads'}
        </p>
      )}

      {!isLoading && !isError && leads.length === 0 && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-16 text-center">
          <p className="text-[16px] font-semibold text-[var(--color-text-heading)] mb-1">
            No leads yet
          </p>
          <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
            Create your first lead to start the pipeline.
          </p>
          <Button
            variant="primary"
            size="md"
            onClick={() => {
              setModalStage('new_lead')
              setModalOpen(true)
            }}
          >
            New Lead
          </Button>
        </div>
      )}

      {!isLoading && !isError && leads.length > 0 && view === 'kanban' && (
        <LeadsKanban
          leads={leads}
          onLeadClick={handleLeadClick}
          onAddLead={handleAddLead}
        />
      )}

      {!isLoading && !isError && leads.length > 0 && view === 'list' && (
        <LeadsTable
          leads={leads}
          onLeadClick={handleLeadClick}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
        />
      )}

      <LeadDrawer
        lead={selectedLead}
        open={drawerOpen}
        isDeleting={deleteLead.isPending}
        onClose={() => {
          setDrawerOpen(false)
          setSelectedLeadId(null)
        }}
        onDelete={
          selectedLead && canDeleteLead(profile, selectedLead)
            ? async (lead) => {
                try {
                  await deleteLead.mutateAsync(lead.id)
                  toast.success('Lead deleted')
                  setDrawerOpen(false)
                  setSelectedLeadId(null)
                } catch (err) {
                  toast.error(
                    err instanceof Error ? err.message : 'Failed to delete',
                  )
                }
              }
            : undefined
        }
      />

      <NewLeadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultStage={modalStage}
        onSubmit={(values) => {
          void handleCreate(values)
        }}
        loading={createLead.isPending}
        canAssign={
          profile?.role === 'admin' || profile?.role === 'manager'
        }
      />
    </DashboardShell>
  )
}
