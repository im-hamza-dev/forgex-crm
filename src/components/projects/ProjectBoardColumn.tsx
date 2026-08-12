import { ProjectCard } from './ProjectCard'
import { getProjectStatus } from '@/constants/project-status'
import type { Project } from '@/types/projects'

interface ProjectBoardColumnProps {
  status: string
  projects: Project[]
  onProjectClick: (project: Project) => void
}

export function ProjectBoardColumn({
  status,
  projects,
  onProjectClick,
}: ProjectBoardColumnProps) {
  const config = getProjectStatus(status)

  return (
    <div className="flex flex-col min-w-[220px] w-[220px] flex-shrink-0">
      <div className="flex items-center gap-2 mb-3 px-1">
        <span
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: config.dotColor }}
        />
        <span
          className="text-[13px] font-semibold"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {config.label}
        </span>
        <span
          className="text-[12px] ml-1"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {projects.length}
        </span>
      </div>

      <div className="flex flex-col gap-2">
        {projects.length === 0 ? (
          <p
            className="text-[13px] py-8 text-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            No projects
          </p>
        ) : (
          projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onClick={() => onProjectClick(project)}
            />
          ))
        )}
      </div>
    </div>
  )
}
