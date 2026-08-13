'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { MoreHorizontal, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Button,
  Dropdown,
  Modal,
  Tabs,
  toast,
} from '@/components/ui'
import { DashboardShell } from '@/components/layout'
import { getProjectStatus } from '@/constants/project-status'
import { useAuth } from '@/hooks/useAuth'
import { useDeleteProject } from '@/hooks/useProjects'
import {
  canDeleteProject,
  canEditProject,
  canInviteClient,
} from '@/lib/project-permissions'
import { ProjectOverviewTab } from './ProjectOverviewTab'
import { ProjectTasksTab } from './ProjectTasksTab'
import { ProjectMilestonesTab } from './ProjectMilestonesTab'
import { ProjectUpdatesTab } from './ProjectUpdatesTab'
import { ProjectFilesTab } from './ProjectFilesTab'
import { ProjectTicketsTab } from './ProjectTicketsTab'
import { InviteClientModal } from './InviteClientModal'
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
  const router = useRouter()
  const { profile } = useAuth()
  const deleteProject = useDeleteProject()

  const [activeTab, setActiveTab] = useState('overview')
  const [editing, setEditing] = useState(false)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  const status = getProjectStatus(project.status)
  const canEdit = canEditProject(profile)
  const canInvite = canInviteClient(profile)
  const canDelete = canDeleteProject(profile)

  const handleDelete = async () => {
    try {
      await deleteProject.mutateAsync(project.id)
      toast.success('Project deleted')
      router.push(ROUTES.PROJECTS)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete project',
      )
    }
  }

  return (
    <DashboardShell
      title={project.name}
      breadcrumb={[
        { label: 'Projects', href: ROUTES.PROJECTS },
        { label: project.name },
      ]}
      notificationCount={0}
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
          {canEdit && (
            <button
              type="button"
              onClick={() => {
                setActiveTab('overview')
                setEditing(true)
              }}
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
          )}
          {canInvite && (
            <button
              type="button"
              onClick={() => setInviteOpen(true)}
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
          )}
          {canDelete && (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((v) => !v)}
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
              <Dropdown
                open={menuOpen}
                onClose={() => setMenuOpen(false)}
                items={[
                  {
                    label: 'Delete project',
                    icon: <Trash2 size={14} />,
                    variant: 'danger',
                    onClick: () => setDeleteOpen(true),
                  },
                ]}
              />
            </div>
          )}
        </div>
      </div>

      <Tabs
        items={DETAIL_TABS}
        active={activeTab}
        onChange={(tab) => {
          setActiveTab(tab)
          if (tab !== 'overview') setEditing(false)
        }}
        className="mb-4"
      />

      {activeTab === 'overview' && (
        <ProjectOverviewTab
          project={project}
          editing={editing}
          onEditingChange={setEditing}
        />
      )}
      {activeTab === 'tasks' && <ProjectTasksTab project={project} />}
      {activeTab === 'milestones' && (
        <ProjectMilestonesTab project={project} />
      )}
      {activeTab === 'updates' && <ProjectUpdatesTab project={project} />}
      {activeTab === 'files' && <ProjectFilesTab project={project} />}
      {activeTab === 'tickets' && <ProjectTicketsTab project={project} />}

      <InviteClientModal
        open={inviteOpen}
        projectId={project.id}
        onClose={() => setInviteOpen(false)}
      />

      <Modal
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete project?"
        description="This permanently deletes the project and related data. This cannot be undone."
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="ghost"
              size="md"
              onClick={() => setDeleteOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={deleteProject.isPending}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p
          className="text-[13px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Delete <strong>{project.name}</strong>?
        </p>
      </Modal>
    </DashboardShell>
  )
}
