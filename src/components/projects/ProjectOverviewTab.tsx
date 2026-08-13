'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Avatar, Button, Input, Select, Textarea, toast } from '@/components/ui'
import {
  PAYMENT_STATUS_CONFIG,
  PROJECT_STATUSES,
} from '@/constants/project-status'
import { ROLE_LABELS } from '@/constants/roles'
import { useAuth } from '@/hooks/useAuth'
import { useUpdateProject } from '@/hooks/useProjects'
import { canEditProject } from '@/lib/project-permissions'
import type { PaymentStatus, Project, ProjectStatus } from '@/types/projects'
import type { TeamRole } from '@/constants/roles'

const SERVICE_LABELS: Record<string, string> = {
  saas_mvp: 'SaaS MVP',
  workflow_automation: 'Workflow Automation',
  custom_crm: 'Custom CRM',
  ai_agents: 'AI Agents',
  tech_retainer: 'Tech Retainer',
  other: 'Other',
}

const STATUS_OPTIONS = PROJECT_STATUSES.map((s) => ({
  value: s.value,
  label: s.label,
}))

const PAYMENT_OPTIONS = Object.entries(PAYMENT_STATUS_CONFIG).map(
  ([value, cfg]) => ({ value, label: cfg.label }),
)

function DetailRow({
  label,
  value,
  children,
}: {
  label: string
  value?: string | null
  children?: ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between py-2.5 border-b"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
        {label}
      </span>
      <div className="text-right">
        {children ?? (
          <span
            className="text-[13px] font-medium"
            style={{ color: 'var(--color-text-body)' }}
          >
            {value ?? '—'}
          </span>
        )}
      </div>
    </div>
  )
}

function clientLabel(project: Project): string {
  return (
    project.client_account?.company ??
    project.client_account?.full_name ??
    '—'
  )
}

function roleLabel(role: string | undefined): string {
  if (!role) return 'Member'
  if (role in ROLE_LABELS) {
    return ROLE_LABELS[role as TeamRole]
  }
  return role
}

interface ProjectOverviewTabProps {
  project: Project
  editing?: boolean
  onEditingChange?: (editing: boolean) => void
}

export function ProjectOverviewTab({
  project,
  editing = false,
  onEditingChange,
}: ProjectOverviewTabProps) {
  const { profile } = useAuth()
  const updateProject = useUpdateProject()
  const canEdit = canEditProject(profile)

  const [name, setName] = useState(project.name)
  const [description, setDescription] = useState(project.description ?? '')
  const [fixedPrice, setFixedPrice] = useState(
    project.fixed_price != null ? String(project.fixed_price) : '',
  )
  const [deadline, setDeadline] = useState(project.deadline ?? '')
  const [status, setStatus] = useState<ProjectStatus>(project.status)
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>(
    project.payment_status,
  )
  const [completionPct, setCompletionPct] = useState(project.completion_pct)
  const [isClientVisible, setIsClientVisible] = useState(
    project.is_client_visible,
  )

  useEffect(() => {
    setName(project.name)
    setDescription(project.description ?? '')
    setFixedPrice(
      project.fixed_price != null ? String(project.fixed_price) : '',
    )
    setDeadline(project.deadline ?? '')
    setStatus(project.status)
    setPaymentStatus(project.payment_status)
    setCompletionPct(project.completion_pct)
    setIsClientVisible(project.is_client_visible)
  }, [project])

  const payment = PAYMENT_STATUS_CONFIG[project.payment_status]
  const members = project.members ?? []

  const save = async () => {
    try {
      const priceRaw = fixedPrice.trim()
      const parsedPrice =
        priceRaw.length > 0 ? Number(priceRaw) : null

      await updateProject.mutateAsync({
        id: project.id,
        data: {
          name: name.trim(),
          description: description.trim() || null,
          fixed_price:
            parsedPrice !== null && !Number.isNaN(parsedPrice)
              ? parsedPrice
              : null,
          deadline: deadline || null,
          status,
          payment_status: paymentStatus,
          completion_pct: completionPct,
          is_client_visible: isClientVisible,
        },
      })
      toast.success('Project updated')
      onEditingChange?.(false)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update project',
      )
    }
  }

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      <div className="flex flex-col gap-4">
        <div
          className="rounded-xl border bg-[var(--color-surface)] p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-center justify-between mb-2">
            <p
              className="text-[12px] font-semibold uppercase tracking-[0.06em]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Description
            </p>
            {canEdit && !editing && (
              <button
                type="button"
                className="text-[12px] font-medium"
                style={{ color: 'var(--color-accent)' }}
                onClick={() => onEditingChange?.(true)}
              >
                Edit
              </button>
            )}
          </div>

          {editing && canEdit ? (
            <div
              className={cn(
                'flex flex-col gap-3',
                updateProject.isPending && 'opacity-60 pointer-events-none',
              )}
            >
              <Input
                label="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Textarea
                label="Description"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <div className="grid grid-cols-2 gap-3">
                <Input
                  label="Fixed price"
                  type="number"
                  value={fixedPrice}
                  onChange={(e) => setFixedPrice(e.target.value)}
                />
                <Input
                  label="Deadline"
                  type="date"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  label="Status"
                  options={STATUS_OPTIONS}
                  value={status}
                  onChange={(e) => setStatus(e.target.value as ProjectStatus)}
                />
                <Select
                  label="Payment"
                  options={PAYMENT_OPTIONS}
                  value={paymentStatus}
                  onChange={(e) =>
                    setPaymentStatus(e.target.value as PaymentStatus)
                  }
                />
              </div>
              <div>
                <label
                  className="block text-[11px] font-medium uppercase tracking-[0.06em] mb-1.5"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  Completion ({completionPct}%)
                </label>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={completionPct}
                  onChange={(e) => setCompletionPct(Number(e.target.value))}
                  className="w-full accent-[var(--color-accent)]"
                />
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isClientVisible}
                  onChange={(e) => setIsClientVisible(e.target.checked)}
                  className="w-4 h-4 accent-[var(--color-accent)]"
                />
                <span
                  className="text-[13px]"
                  style={{ color: 'var(--color-text-body)' }}
                >
                  Visible to client
                </span>
              </label>
              <div className="flex items-center justify-end gap-2 pt-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEditingChange?.(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  loading={updateProject.isPending}
                  onClick={() => void save()}
                >
                  Save
                </Button>
              </div>
            </div>
          ) : (
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: 'var(--color-text-body)' }}
            >
              {project.description ?? 'No description yet.'}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <div
          className="rounded-xl border bg-[var(--color-surface)] p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p
            className="text-[14px] font-semibold mb-1"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Details
          </p>

          <DetailRow label="Client" value={clientLabel(project)} />
          <DetailRow label="Service">
            {project.service_type && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                }}
              >
                {SERVICE_LABELS[project.service_type] ?? project.service_type}
              </span>
            )}
          </DetailRow>
          <DetailRow label="Contract Value">
            <span
              className="text-[13px] font-semibold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {project.fixed_price != null
                ? `${project.currency} ${project.fixed_price.toLocaleString()}`
                : '—'}
            </span>
          </DetailRow>
          <DetailRow label="Payment">
            {payment && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{ background: payment.bg, color: payment.color }}
              >
                {payment.label}
              </span>
            )}
          </DetailRow>
          <DetailRow label="Deadline" value={project.deadline} />
          <DetailRow
            label="Client visible"
            value={project.is_client_visible ? 'Yes' : 'No'}
          />

          <div className="mt-4 text-center">
            <p
              className="text-[52px] font-bold leading-none"
              style={{ color: 'var(--color-accent)' }}
            >
              {project.completion_pct}%
            </p>
            <p
              className="text-[12px] mb-3"
              style={{ color: 'var(--color-text-muted)' }}
            >
              complete
            </p>
            <div
              className="h-1.5 rounded-full overflow-hidden"
              style={{ background: 'var(--color-border)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${project.completion_pct}%`,
                  background: 'var(--color-accent)',
                }}
              />
            </div>
          </div>
        </div>

        <div
          className="rounded-xl border bg-[var(--color-surface)] p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p
            className="text-[14px] font-semibold mb-3"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Team
          </p>
          {members.length === 0 ? (
            <p
              className="text-[13px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No members yet
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {members.map((member) => {
                const name = member.profile?.full_name ?? 'Member'
                return (
                  <div key={member.id} className="flex items-center gap-3">
                    <Avatar
                      name={name}
                      src={member.profile?.avatar_url}
                      size="sm"
                    />
                    <div>
                      <p
                        className="text-[13px] font-semibold"
                        style={{ color: 'var(--color-text-heading)' }}
                      >
                        {name}
                      </p>
                      <p
                        className="text-[11px]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {roleLabel(member.profile?.role)}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
