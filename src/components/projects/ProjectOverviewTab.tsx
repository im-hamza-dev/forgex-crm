'use client'

import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { PAYMENT_STATUS_CONFIG, TASK_PRIORITY_CONFIG } from '@/constants/project-status'
import type { Project } from '@/types/projects'

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

export function ProjectOverviewTab({ project }: { project: Project }) {
  const payment = PAYMENT_STATUS_CONFIG[project.payment_status]

  return (
    <div className="grid grid-cols-[1fr_320px] gap-5">
      <div className="flex flex-col gap-4">
        <div
          className="rounded-xl border bg-[var(--color-surface)] p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p
            className="text-[12px] font-semibold uppercase tracking-[0.06em] mb-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Description
          </p>
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: 'var(--color-text-body)' }}
          >
            {project.description ?? 'No description yet.'}
          </p>
        </div>

        <div
          className="rounded-xl border bg-[var(--color-surface)] p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <p
            className="text-[14px] font-semibold mb-3"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Tasks ({project.tasks.length})
          </p>
          <div className="flex flex-col gap-0">
            {project.tasks.map((task, i) => {
              const priority = TASK_PRIORITY_CONFIG[task.priority]
              const isDone = task.status === 'done'
              return (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2.5"
                  style={{
                    borderBottom:
                      i < project.tasks.length - 1
                        ? '1px solid var(--color-border)'
                        : undefined,
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isDone}
                    readOnly
                    className="w-4 h-4 rounded shrink-0 accent-[var(--color-accent)]"
                  />
                  <span
                    className={cn(
                      'flex-1 text-[13px]',
                      isDone && 'line-through opacity-50',
                    )}
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    {task.title}
                  </span>
                  <span className="flex items-center gap-1 shrink-0">
                    <span
                      className="w-1.5 h-1.5 rounded-full"
                      style={{ background: priority?.color }}
                    />
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {priority?.label}
                    </span>
                  </span>
                  <span
                    className="text-[11px] tabular-nums shrink-0"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {task.due_date}
                  </span>
                </div>
              )
            })}
          </div>
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

          <DetailRow label="Client" value={project.client_name} />
          <DetailRow label="Service">
            {project.service_type && (
              <span
                className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                }}
              >
                {project.service_type}
              </span>
            )}
          </DetailRow>
          <DetailRow label="Contract Value">
            <span
              className="text-[13px] font-semibold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              ${project.fixed_price?.toLocaleString() ?? '—'}
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
          <div className="flex flex-col gap-3">
            {project.team.map((member) => (
              <div key={member.id} className="flex items-center gap-3">
                <Avatar name={member.name} src={member.avatar_url} size="sm" />
                <div>
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {member.name}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {member.role}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
