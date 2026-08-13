'use client'

import { useState } from 'react'
import { Copy, ExternalLink } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Avatar, Button, toast } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { useLeadActivity, useUpdateLead } from '@/hooks/useLeads'
import { canEditLead } from '@/lib/leads-permissions'
import { getStage, LEAD_STAGES } from '@/constants/lead-stages'
import type { Lead, LeadActivity, LeadPriority, LeadStatus } from '@/types/leads'

const SERVICE_LABELS: Record<string, string> = {
  saas_mvp: 'SaaS MVP',
  workflow_automation: 'Workflow Automation',
  custom_crm: 'Custom CRM',
  ai_agents: 'AI Agents',
  tech_retainer: 'Tech Retainer',
  other: 'Other',
}

const SOURCE_LABELS: Record<string, string> = {
  website_form: 'Website form',
  referral: 'Referral',
  cold_outreach: 'Cold outreach',
  social: 'Social media',
  linkedin: 'LinkedIn',
  other: 'Other',
}

const STATUS_STYLES: Record<string, { bg: string; text: string }> = {
  active: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
  won: { bg: 'var(--color-success-bg)', text: 'var(--color-success)' },
  lost: { bg: 'var(--color-danger-bg)', text: 'var(--color-danger)' },
  archived: {
    bg: 'var(--color-surface-hover)',
    text: 'var(--color-text-muted)',
  },
}

function formatActivity(item: LeadActivity): string {
  const meta = item.metadata
  switch (item.action) {
    case 'lead_created':
      return `${item.actor_name} created this lead`
    case 'stage_changed': {
      const from = getStage(String(meta.from ?? '')).label
      const to = getStage(String(meta.to ?? '')).label
      return `${item.actor_name} moved from ${from} to ${to}`
    }
    case 'note_added':
      return `${item.actor_name} added a note`
    case 'note_deleted':
      return `${item.actor_name} deleted a note`
    case 'attachment_added':
      return `${item.actor_name} uploaded a file`
    case 'attachment_deleted':
      return `${item.actor_name} deleted a file`
    case 'lead_assigned':
      return `${item.actor_name} assigned to ${String(meta.assignee_name ?? 'someone')}`
    case 'lead_updated':
      return `${item.actor_name} updated this lead`
    default:
      return `${item.actor_name} updated this lead`
  }
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-text-muted)] mb-1">
      {children}
    </p>
  )
}

function FieldValue({
  children,
  muted = false,
  mono = false,
}: {
  children: React.ReactNode
  muted?: boolean
  mono?: boolean
}) {
  return (
    <p
      className={cn(
        'text-[14px] leading-snug',
        muted
          ? 'text-[var(--color-text-muted)]'
          : 'text-[var(--color-text-body)]',
        mono && 'font-mono text-[13px]',
      )}
    >
      {children}
    </p>
  )
}

function LeadScoreDots({
  score,
  onChange,
}: {
  score: number | null
  onChange?: (score: number) => void
}) {
  return (
    <div className="flex items-center gap-[3px] mt-1">
      {Array.from({ length: 10 }).map((_, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onChange?.(i + 1)}
          className={cn(
            'w-[12px] h-[12px] rounded-full transition-colors shrink-0',
            onChange ? 'cursor-pointer hover:opacity-80' : 'cursor-default',
          )}
          style={{
            background:
              score != null && i < score
                ? 'var(--color-accent)'
                : '#E8E8E8',
          }}
        />
      ))}
    </div>
  )
}

interface LeadDrawerOverviewProps {
  lead: Lead
}

export function LeadDrawerOverview({ lead }: LeadDrawerOverviewProps) {
  const { profile } = useAuth()
  const canEdit = canEditLead(profile, lead)
  const updateLead = useUpdateLead()
  const { data: activity = [], isLoading: activityLoading } = useLeadActivity(
    lead.id,
  )
  const [editing, setEditing] = useState(false)
  const localScore = lead.lead_score ?? null
  const [draft, setDraft] = useState({
    contact_name: lead.contact_name,
    company: lead.company ?? '',
    email: lead.email ?? '',
    phone: lead.phone ?? '',
    linkedin_url: lead.linkedin_url ?? '',
    budget_range: lead.budget_range ?? '',
    priority: lead.priority,
    stage: lead.stage,
    status: lead.status,
    lead_score: lead.lead_score?.toString() ?? '',
    next_follow_up: lead.next_follow_up ?? '',
  })
  const [addingTag, setAddingTag] = useState(false)
  const [tagInput, setTagInput] = useState('')

  const assigneeName =
    (lead as any).assignee_name ??
    lead.assigned_profile?.full_name ??
    null
  const assigneeAvatar =
    (lead as any).assignee_avatar ??
    lead.assigned_profile?.avatar_url ??
    null
  const statusStyle =
    STATUS_STYLES[lead.status] ?? {
      bg: 'var(--color-success-bg)',
      text: 'var(--color-success)',
    }

  const createdDate = lead.created_at
    ? new Date(lead.created_at).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : null

  const save = async () => {
    try {
      const score = draft.lead_score.trim()
      await updateLead.mutateAsync({
        id: lead.id,
        data: {
          contact_name: draft.contact_name,
          company: draft.company || null,
          email: draft.email || null,
          phone: draft.phone || null,
          linkedin_url: draft.linkedin_url || null,
          budget_range: draft.budget_range || null,
          priority: draft.priority as LeadPriority,
          stage: draft.stage,
          status: draft.status as LeadStatus,
          lead_score: score ? Number(score) : null,
          next_follow_up: draft.next_follow_up || null,
        },
      })
      toast.success('Lead updated')
      setEditing(false)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleAddTag = async () => {
    const newTag = tagInput.trim().toLowerCase()
    if (!newTag) return
    const currentTags = lead.tags ?? []
    if (currentTags.includes(newTag)) {
      toast.error('Tag already exists')
      return
    }
    try {
      await updateLead.mutateAsync({
        id: lead.id,
        data: { tags: [...currentTags, newTag] },
      })
      setTagInput('')
      setAddingTag(false)
      toast.success('Tag added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add tag')
    }
  }

  console.log('[LeadDrawerOverview]', {
    budget_range: lead.budget_range,
    lead_score: lead.lead_score,
    localScore,
  })

  return (
    <div className="flex flex-col">
      {/* Status bar + Edit */}
      <div className="flex items-center justify-between gap-2 px-5 pt-4 pb-3">
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize"
          style={{ background: statusStyle.bg, color: statusStyle.text }}
        >
          {lead.status}
        </span>
        {canEdit && !editing && (
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
        )}
        {editing && (
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={updateLead.isPending}
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              loading={updateLead.isPending}
              onClick={() => void save()}
            >
              Save
            </Button>
          </div>
        )}
      </div>

      <div className="h-px bg-[var(--color-border)]" />

      {/* VIEW MODE */}
      {!editing && (
        <div className="px-5 py-4 flex flex-col gap-[14px]">
          {/* Contact Name — prominent */}
          <div>
            <FieldLabel>Contact Name</FieldLabel>
            <p className="text-[15px] font-semibold text-[var(--color-text-heading)]">
              {lead.contact_name}
            </p>
          </div>

          {/* Email + Phone */}
          <div className="grid grid-cols-2 gap-x-4 gap-y-0">
            <div className="min-w-0">
              <FieldLabel>Email</FieldLabel>
              {lead.email ? (
                <div className="flex items-center gap-1 min-w-0">
                  <p className="text-[13px] text-[var(--color-text-body)] truncate min-w-0 flex-1">
                    {lead.email}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(lead.email ?? '')
                    }
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors shrink-0"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              ) : (
                <FieldValue muted>—</FieldValue>
              )}
            </div>
            <div className="min-w-0">
              <FieldLabel>Phone</FieldLabel>
              {lead.phone ? (
                <div className="flex items-center gap-1 min-w-0">
                  <p className="text-[13px] text-[var(--color-text-body)] truncate min-w-0 flex-1">
                    {lead.phone}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      void navigator.clipboard.writeText(lead.phone ?? '')
                    }
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-accent)] transition-colors shrink-0"
                  >
                    <Copy size={11} />
                  </button>
                </div>
              ) : (
                <FieldValue muted>—</FieldValue>
              )}
            </div>
          </div>

          {/* Source + Service Interest */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Source</FieldLabel>
              <FieldValue>
                {SOURCE_LABELS[lead.source] ?? lead.source}
              </FieldValue>
            </div>
            <div>
              <FieldLabel>Service Interest</FieldLabel>
              <FieldValue muted={!lead.service_interest}>
                {lead.service_interest
                  ? (SERVICE_LABELS[lead.service_interest] ??
                    lead.service_interest)
                  : '—'}
              </FieldValue>
            </div>
          </div>

          {/* Budget Range + Lead Score */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <FieldLabel>Budget Range</FieldLabel>
              <FieldValue mono muted={!lead.budget_range}>
                {lead.budget_range ?? '—'}
              </FieldValue>
            </div>
            <div>
              <FieldLabel>Lead Score</FieldLabel>
              <LeadScoreDots score={localScore} />
            </div>
          </div>

          {/* Assigned To */}
          <div>
            <FieldLabel>Assigned To</FieldLabel>
            {assigneeName ? (
              <div className="flex items-center gap-2 mt-0.5">
                <Avatar
                  name={assigneeName}
                  src={assigneeAvatar ?? undefined}
                  size="sm"
                />
                <span className="text-[14px] text-[var(--color-text-body)]">
                  {assigneeName}
                </span>
              </div>
            ) : (
              <FieldValue muted>Unassigned</FieldValue>
            )}
          </div>

          {/* Next Follow-up */}
          {lead.next_follow_up && (
            <div>
              <FieldLabel>Next Follow-up</FieldLabel>
              <FieldValue mono>{lead.next_follow_up}</FieldValue>
            </div>
          )}

          {/* Created */}
          {createdDate && (
            <div>
              <FieldLabel>Created</FieldLabel>
              <FieldValue muted>{createdDate}</FieldValue>
            </div>
          )}

          {/* LinkedIn */}
          {lead.linkedin_url && (
            <div>
              <FieldLabel>LinkedIn</FieldLabel>
              <a
                href={lead.linkedin_url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1 text-[13px] text-[var(--color-accent)] hover:underline"
              >
                View profile
                <ExternalLink size={11} />
              </a>
            </div>
          )}

          {/* Tags */}
          <div>
            <FieldLabel>Tags</FieldLabel>
            <div className="flex flex-wrap gap-1.5 mt-0.5">
              {(lead.tags ?? []).map((tag) => (
                <span
                  key={tag}
                  className="group flex items-center gap-1 px-3 py-1 rounded-full text-[12px] font-medium bg-[var(--color-accent-subtle)] text-[var(--color-accent)]"
                >
                  {tag}
                  {canEdit && (
                    <button
                      type="button"
                      onClick={async () => {
                        try {
                          await updateLead.mutateAsync({
                            id: lead.id,
                            data: {
                              tags: (lead.tags ?? []).filter((t) => t !== tag),
                            },
                          })
                          toast.success('Tag removed')
                        } catch {
                          toast.error('Failed to remove tag')
                        }
                      }}
                      className="opacity-0 group-hover:opacity-100 ml-0.5 hover:text-[var(--color-danger)] transition-all"
                      aria-label={`Remove tag ${tag}`}
                    >
                      ×
                    </button>
                  )}
                </span>
              ))}
              {canEdit && !addingTag && (
                <button
                  type="button"
                  onClick={() => setAddingTag(true)}
                  className="px-3 py-1 rounded-full text-[12px] font-medium border border-dashed border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-[var(--color-accent)] hover:text-[var(--color-accent)] transition-colors"
                >
                  + Add tag
                </button>
              )}
              {canEdit && addingTag && (
                <div className="flex items-center gap-1">
                  <input
                    type="text"
                    value={tagInput}
                    autoFocus
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') void handleAddTag()
                      if (e.key === 'Escape') {
                        setAddingTag(false)
                        setTagInput('')
                      }
                    }}
                    placeholder="tag name"
                    className="h-[26px] px-2 rounded-full text-[12px] border border-[var(--color-accent)] bg-[var(--color-surface)] text-[var(--color-text-body)] outline-none w-[90px]"
                  />
                  <button
                    type="button"
                    onClick={() => void handleAddTag()}
                    disabled={!tagInput.trim() || updateLead.isPending}
                    className="h-[26px] px-2 rounded-full text-[12px] font-medium bg-[var(--color-accent)] text-white disabled:opacity-40"
                  >
                    {updateLead.isPending ? '...' : 'Add'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddingTag(false)
                      setTagInput('')
                    }}
                    className="h-[26px] px-2 rounded-full text-[12px] text-[var(--color-text-muted)] hover:text-[var(--color-text-body)]"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* EDIT MODE */}
      {editing && (
        <div
          className={cn(
            'px-5 py-4 flex flex-col gap-3',
            updateLead.isPending && 'opacity-60 pointer-events-none',
          )}
        >
          {(
            [
              ['contact_name', 'Contact Name', 'text'],
              ['company', 'Company', 'text'],
              ['email', 'Email', 'text'],
              ['phone', 'Phone', 'text'],
              ['linkedin_url', 'LinkedIn URL', 'text'],
              ['budget_range', 'Budget Range', 'text'],
              ['lead_score', 'Lead Score (1–10)', 'text'],
              ['next_follow_up', 'Next Follow-Up', 'date'],
            ] as const
          ).map(([key, label, type]) => (
            <div key={key}>
              <p className="text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)] mb-1">
                {label}
              </p>
              <input
                type={type}
                value={draft[key]}
                disabled={updateLead.isPending}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [key]: e.target.value }))
                }
                className="w-full h-[36px] px-2.5 rounded-lg text-[13px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-body)] outline-none focus:border-[var(--color-accent)] disabled:opacity-50"
              />
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)] mb-1">
                Priority
              </p>
              <select
                value={draft.priority}
                disabled={updateLead.isPending}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    priority: e.target.value as LeadPriority,
                  }))
                }
                className="w-full h-[36px] px-2 rounded-lg text-[13px] border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-50"
              >
                <option value="hot">Hot</option>
                <option value="warm">Warm</option>
                <option value="cold">Cold</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)] mb-1">
                Stage
              </p>
              <select
                value={draft.stage}
                disabled={updateLead.isPending}
                onChange={(e) =>
                  setDraft((d) => ({
                    ...d,
                    stage: e.target.value as Lead['stage'],
                  }))
                }
                className="w-full h-[36px] px-2 rounded-lg text-[13px] border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-50"
              >
                {LEAD_STAGES.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-semibold uppercase text-[var(--color-text-muted)] mb-1">
              Status
            </p>
            <select
              value={draft.status}
              disabled={updateLead.isPending}
              onChange={(e) =>
                setDraft((d) => ({
                  ...d,
                  status: e.target.value as LeadStatus,
                }))
              }
              className="w-full h-[36px] px-2 rounded-lg text-[13px] border border-[var(--color-border)] bg-[var(--color-surface)] disabled:opacity-50"
            >
              <option value="active">Active</option>
              <option value="won">Won</option>
              <option value="lost">Lost</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      )}

      {/* ACTIVITY */}
      <div className="h-px bg-[var(--color-border)]" />
      <div className="px-5 py-4 flex flex-col gap-3">
        <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
          Activity
        </p>
        {activityLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[14px] rounded animate-pulse bg-[var(--color-surface-hover)]"
                style={{ width: `${55 + i * 12}%` }}
              />
            ))}
          </div>
        )}
        {!activityLoading && activity.length === 0 && (
          <p className="text-[12px] text-[var(--color-text-muted)]">
            No activity yet
          </p>
        )}
        <ul className="flex flex-col gap-3">
          {activity.map((item, idx) => (
            <li key={item.id} className="flex items-start gap-3">
              <div className="flex flex-col items-center shrink-0 pt-1">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ background: 'var(--color-accent)' }}
                />
                {idx < activity.length - 1 && (
                  <span
                    className="w-px mt-1 grow"
                    style={{
                      background: 'var(--color-border)',
                      minHeight: 16,
                    }}
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 pb-1">
                <p className="text-[13px] text-[var(--color-text-body)] leading-snug">
                  {formatActivity(item)}
                </p>
                <p className="text-[11px] text-[var(--color-text-muted)] mt-0.5">
                  {formatDistanceToNow(new Date(item.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
