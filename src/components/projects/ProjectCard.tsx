'use client'

import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import type { Project } from '@/types/projects'

interface ProjectCardProps {
  project: Project
  onClick: () => void
}

const SERVICE_LABELS: Record<string, string> = {
  saas_mvp: 'SaaS MVP',
  workflow_automation: 'Workflow Automation',
  custom_crm: 'Custom CRM',
  ai_agents: 'AI Agents',
  tech_retainer: 'Tech Retainer',
  other: 'Other',
}

export function ProjectCard({ project, onClick }: ProjectCardProps) {
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'w-full text-left bg-[var(--color-surface)]',
        'border border-[var(--color-border)] rounded-[10px]',
        'p-4 cursor-pointer select-none',
        'transition-shadow hover:shadow-[0_2px_8px_rgba(26,16,8,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-0.5">
        <p
          className="text-[14px] font-semibold leading-snug"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {project.name}
        </p>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <span
          className="text-[12px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {project.client_name}
        </span>
        {project.service_type && (
          <span
            className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
            style={{
              background: 'var(--color-accent-subtle)',
              color: 'var(--color-accent)',
            }}
          >
            {SERVICE_LABELS[project.service_type] ?? project.service_type}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-1.5">
        <span
          className="text-[11px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {project.completion_pct}% complete
        </span>
        <span
          className="text-[11px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {project.tasks.filter((t) => t.status === 'done').length}/
          {project.tasks.length} tasks
        </span>
      </div>

      <div
        className="h-1 rounded-full mb-3 overflow-hidden"
        style={{ background: 'var(--color-border)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{
            width: `${project.completion_pct}%`,
            background: 'var(--color-accent)',
          }}
        />
      </div>

      <div className="flex items-center justify-between">
        <span
          className="text-[11px] tabular-nums"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {project.deadline}
        </span>
        <div className="flex items-center">
          {project.team.slice(0, 3).map((member, i) => (
            <div
              key={member.id}
              className="ring-2 ring-white rounded-full"
              style={{ marginLeft: i > 0 ? '-6px' : '0' }}
            >
              <Avatar name={member.name} src={member.avatar_url} size="xs" />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
