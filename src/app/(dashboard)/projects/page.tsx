'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { DashboardShell } from '@/components/layout'
import { Button, SegmentedControl } from '@/components/ui'
import { ProjectsBoard, ProjectsTable } from '@/components/projects'
import { MOCK_PROJECTS } from '@/components/projects/mock-data'
import { ROUTES } from '@/constants/routes'
import type { Project } from '@/types/projects'

type ProjectsView = 'board' | 'list'

export default function ProjectsPage() {
  const router = useRouter()
  const [view, setView] = useState<ProjectsView>('board')

  const handleProjectClick = (project: Project) => {
    router.push(ROUTES.PROJECT(project.id))
  }

  return (
    <DashboardShell title="Projects" notificationCount={3}>
      <div className="flex items-center justify-between mb-5">
        <SegmentedControl
          value={view}
          onChange={(v) => setView(v as ProjectsView)}
          options={[
            { value: 'board', label: 'Board' },
            { value: 'list', label: 'List' },
          ]}
        />
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={15} />}
          className="rounded-lg"
          onClick={() => console.log('New project')}
        >
          New Project
        </Button>
      </div>

      {view === 'board' && (
        <ProjectsBoard
          projects={MOCK_PROJECTS}
          onProjectClick={handleProjectClick}
        />
      )}
      {view === 'list' && (
        <ProjectsTable
          projects={MOCK_PROJECTS}
          onProjectClick={handleProjectClick}
        />
      )}
    </DashboardShell>
  )
}
