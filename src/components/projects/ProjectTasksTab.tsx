import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { TASK_PRIORITY_CONFIG } from '@/constants/project-status'
import type { Project, TaskStatus } from '@/types/projects'

const TASK_COLUMNS: { status: TaskStatus; label: string; dotColor: string }[] = [
  { status: 'todo', label: 'Todo', dotColor: '#9CA3AF' },
  { status: 'in_progress', label: 'In Progress', dotColor: '#1A3D6B' },
  { status: 'done', label: 'Done', dotColor: '#2D6A2D' },
]

export function ProjectTasksTab({ project }: { project: Project }) {
  return (
    <div className="flex gap-4">
      {TASK_COLUMNS.map((col) => {
        const tasks = project.tasks.filter((t) => t.status === col.status)
        return (
          <div key={col.status} className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 mb-3">
              <span
                className="w-2 h-2 rounded-full"
                style={{ background: col.dotColor }}
              />
              <span
                className="text-[13px] font-semibold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                {col.label}
              </span>
              <span
                className="text-[12px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {tasks.length}
              </span>
            </div>

            <div className="flex flex-col gap-2">
              {tasks.map((task) => {
                const priority = TASK_PRIORITY_CONFIG[task.priority]
                return (
                  <div
                    key={task.id}
                    className={cn(
                      'bg-[var(--color-surface)] border rounded-[10px] p-3.5 cursor-pointer',
                      'transition-shadow hover:shadow-[0_2px_8px_rgba(26,16,8,0.08)]',
                    )}
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <p
                      className="text-[13px] font-medium mb-2.5"
                      style={{ color: 'var(--color-text-heading)' }}
                    >
                      {task.title}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: priority?.color }}
                        />
                        <span
                          className="text-[11px]"
                          style={{ color: 'var(--color-text-secondary)' }}
                        >
                          {priority?.label}
                        </span>
                      </span>
                      <div className="flex items-center gap-2">
                        {task.assignee_name && (
                          <Avatar
                            name={task.assignee_name}
                            src={task.assignee_avatar}
                            size="xs"
                          />
                        )}
                        {task.due_date && (
                          <span
                            className="text-[11px] tabular-nums"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            {task.due_date}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
