'use client'

import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs } from '@/components/ui'
import { DashboardShell } from '@/components/layout'
import { getProjectStatus } from '@/constants/project-status'
import { ProjectOverviewTab } from './ProjectOverviewTab'
import { ProjectTasksTab } from './ProjectTasksTab'
import { ProjectMilestonesTab } from './ProjectMilestonesTab'
import { ProjectUpdatesTab } from './ProjectUpdatesTab'
import { ProjectFilesTab } from './ProjectFilesTab'
import { ProjectTicketsTab } from './ProjectTicketsTab'
import type { Project } from '@/types/projects'
import { ROUTES } from '@/constants/routes'

const SERVICE_LABELS: Record<string, string> = {
  saas_mvp: 'SaaS MVP',
  workflow_automation: 'Workflow Automation',
  custom_crm: 'Custom CRM',
  ai_agents: 'AI Agents',
  tech_retainer: 'Tech Retainer',
  other: 'Other',
}

const DETAIL_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'milestones', label: 'Milestones' },
  { id: 'updates', label: 'Updates' },
  { id: 'files', label: 'Files' },
  { id: 'tickets', label: 'Tickets' },
]

interface ProjectDetailProps {
  project: Project
}

export function ProjectDetail({ project }: ProjectDetailProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const status = getProjectStatus(project.status)

  return (
    <DashboardShell
      title={project.name}
      breadcrumb={[
        { label: 'Projects', href: ROUTES.PROJECTS },
        { label: project.name },
      ]}
      notificationCount={3}
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1
            className="text-[26px] font-bold leading-tight mb-2"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {project.name}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: status.badgeBg, color: status.badgeText }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: status.dotColor }}
              />
              {status.label}
            </span>
            {project.service_type && (
              <span
                className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                style={{
                  background: 'var(--color-accent-subtle)',
                  color: 'var(--color-accent)',
                }}
              >
                {SERVICE_LABELS[project.service_type] ?? project.service_type}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            className={cn(
              'h-[34px] px-4 rounded-lg text-[13px] font-medium border transition-colors',
              'hover:bg-[var(--color-surface-hover)]',
            )}
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-body)',
            }}
          >
            Edit
          </button>
          <button
            type="button"
            className={cn(
              'h-[34px] px-4 rounded-lg text-[13px] font-medium border transition-colors',
              'hover:bg-[var(--color-surface-hover)]',
            )}
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-body)',
            }}
          >
            Invite Client
          </button>
          <button
            type="button"
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg border transition-colors',
              'hover:bg-[var(--color-surface-hover)]',
            )}
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
            aria-label="More options"
          >
            <MoreHorizontal size={15} />
          </button>
        </div>
      </div>

      <Tabs
        items={DETAIL_TABS}
        active={activeTab}
        onChange={setActiveTab}
        className="mb-4"
      />

      {activeTab === 'overview' && <ProjectOverviewTab project={project} />}
      {activeTab === 'tasks' && <ProjectTasksTab project={project} />}
      {activeTab === 'milestones' && <ProjectMilestonesTab project={project} />}
      {activeTab === 'updates' && <ProjectUpdatesTab project={project} />}
      {activeTab === 'files' && <ProjectFilesTab project={project} />}
      {activeTab === 'tickets' && <ProjectTicketsTab project={project} />}
    </DashboardShell>
  )
}
