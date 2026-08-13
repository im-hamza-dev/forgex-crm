'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { FolderKanban, Plus } from 'lucide-react'
import { DashboardShell } from '@/components/layout'
import { Button, EmptyState, SegmentedControl } from '@/components/ui'
import { ProjectsBoard, ProjectsTable } from '@/components/projects'
import { useAuth } from '@/hooks/useAuth'
import { useProjects } from '@/hooks/useProjects'
import { canCreateProject } from '@/lib/project-permissions'
import { ROUTES } from '@/constants/routes'
import type { Project } from '@/types/projects'

type ProjectsView = 'board' | 'list'

export default function ProjectsPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [view, setView] = useState<ProjectsView>('board')
  const { data: projects = [], isLoading, isError, error } = useProjects()

  const handleProjectClick = (project: Project) => {
    router.push(ROUTES.PROJECT(project.id))
  }

  return (
    <DashboardShell title="Projects" notificationCount={0}>
      <div className="flex items-center justify-between mb-5">
        <SegmentedControl
          value={view}
          onChange={(v) => setView(v as ProjectsView)}
          options={[
            { value: 'board', label: 'Board' },
            { value: 'list', label: 'List' },
          ]}
        />
        {canCreateProject(profile) && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={15} />}
            className="rounded-lg"
            onClick={() => router.push('/projects/new')}
          >
            New Project
          </Button>
        )}
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
          {error instanceof Error ? error.message : 'Failed to load projects'}
        </p>
      )}

      {!isLoading && !isError && projects.length === 0 && (
        <EmptyState
          icon={<FolderKanban size={36} />}
          title="No projects yet"
          description="Create your first project to start tracking delivery."
          action={
            canCreateProject(profile)
              ? {
                  label: 'New Project',
                  onClick: () => router.push('/projects/new'),
                }
              : undefined
          }
        />
      )}

      {!isLoading && !isError && projects.length > 0 && view === 'board' && (
        <ProjectsBoard
          projects={projects}
          onProjectClick={handleProjectClick}
        />
      )}
      {!isLoading && !isError && projects.length > 0 && view === 'list' && (
        <ProjectsTable
          projects={projects}
          onProjectClick={handleProjectClick}
        />
      )}
    </DashboardShell>
  )
}
