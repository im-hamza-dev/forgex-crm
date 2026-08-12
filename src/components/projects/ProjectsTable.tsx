'use client'

import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { getProjectStatus } from '@/constants/project-status'
import type { Project } from '@/types/projects'

interface ProjectsTableProps {
  projects: Project[]
  onProjectClick: (project: Project) => void
}

export function ProjectsTable({ projects, onProjectClick }: ProjectsTableProps) {
  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)]"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {[
              { label: 'Project', cls: 'text-left pl-5' },
              { label: 'Client', cls: 'text-left w-[180px]' },
              { label: 'Status', cls: 'text-left w-[140px]' },
              { label: 'Completion', cls: 'text-left w-[220px]' },
              { label: 'Deadline', cls: 'text-left w-[120px]' },
              { label: 'Team', cls: 'text-left w-[100px]' },
              { label: '', cls: 'w-10 pr-4' },
            ].map((col, i) => (
              <th
                key={i}
                className={cn(
                  'py-3 text-[11px] font-semibold uppercase tracking-[0.06em]',
                  col.cls,
                )}
                style={{ color: 'var(--color-text-muted)' }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((project, i) => {
            const status = getProjectStatus(project.status)

            return (
              <tr
                key={project.id}
                className="group transition-colors hover:bg-[var(--color-surface-hover)] cursor-pointer"
                style={{
                  borderBottom:
                    i < projects.length - 1
                      ? '1px solid var(--color-border)'
                      : undefined,
                }}
                onClick={() => onProjectClick(project)}
              >
                <td className="py-4 pl-5 pr-4">
                  <p
                    className="text-[14px] font-semibold"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {project.name}
                  </p>
                </td>

                <td className="py-4 pr-4 w-[180px]">
                  <p
                    className="text-[13px]"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {project.client_name ?? '—'}
                  </p>
                </td>

                <td className="py-4 pr-4 w-[140px]">
                  <span
                    className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold"
                    style={{
                      background: status.badgeBg,
                      color: status.badgeText,
                    }}
                  >
                    {status.label}
                  </span>
                </td>

                <td className="py-4 pr-4 w-[220px]">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-1 h-1.5 rounded-full overflow-hidden"
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
                    <span
                      className="text-[12px] tabular-nums shrink-0 w-8 text-right"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {project.completion_pct}%
                    </span>
                  </div>
                </td>

                <td className="py-4 pr-4 w-[120px]">
                  <span
                    className="text-[12px] tabular-nums"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {project.deadline ?? '—'}
                  </span>
                </td>

                <td className="py-4 pr-4 w-[100px]">
                  <div className="flex items-center">
                    {project.team.slice(0, 3).map((member, mi) => (
                      <div
                        key={member.id}
                        className="ring-2 ring-white rounded-full"
                        style={{ marginLeft: mi > 0 ? '-6px' : '0' }}
                      >
                        <Avatar
                          name={member.name}
                          src={member.avatar_url}
                          size="xs"
                        />
                      </div>
                    ))}
                  </div>
                </td>

                <td
                  className="pr-4 w-10"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    type="button"
                    className={cn(
                      'flex items-center justify-center w-7 h-7 rounded-lg',
                      'opacity-0 group-hover:opacity-100 transition-opacity',
                      'hover:bg-[var(--color-surface-hover)]',
                    )}
                    style={{ color: 'var(--color-text-muted)' }}
                    aria-label="Project actions"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
