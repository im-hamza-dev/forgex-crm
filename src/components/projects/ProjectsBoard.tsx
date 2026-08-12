import { PROJECT_STATUSES } from '@/constants/project-status'
import { ProjectBoardColumn } from './ProjectBoardColumn'
import type { Project } from '@/types/projects'

interface ProjectsBoardProps {
  projects: Project[]
  onProjectClick: (project: Project) => void
}

export function ProjectsBoard({ projects, onProjectClick }: ProjectsBoardProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {PROJECT_STATUSES.map((status) => (
        <ProjectBoardColumn
          key={status.value}
          status={status.value}
          projects={projects.filter((p) => p.status === status.value)}
          onProjectClick={onProjectClick}
        />
      ))}
    </div>
  )
}
