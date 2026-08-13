'use client'

import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Button, toast } from '@/components/ui'
import { TASK_PRIORITY_CONFIG } from '@/constants/project-status'
import { useProjectTasks } from '@/hooks/useProjects'
import type { Project, ProjectTaskRow } from '@/types/projects'
import type { Database } from '@/types/database.types'

type TaskStatus = Database['public']['Enums']['task_status']

const TASK_COLUMNS: {
  status: TaskStatus
  label: string
  dotColor: string
}[] = [
  { status: 'todo', label: 'Todo', dotColor: '#E8E8E8' },
  {
    status: 'in_progress',
    label: 'In Progress',
    dotColor: 'var(--color-accent)',
  },
  { status: 'done', label: 'Done', dotColor: 'var(--color-success)' },
]

function TaskCard({ task }: { task: ProjectTaskRow }) {
  const priority = TASK_PRIORITY_CONFIG[task.priority]
  const assigneeName = task.assignee?.full_name

  return (
    <div
      className={cn(
        'bg-[var(--color-surface)] border rounded-[10px] p-3.5',
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
          {assigneeName && (
            <Avatar
              name={assigneeName}
              src={task.assignee?.avatar_url}
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
}

export function ProjectTasksTab({ project }: { project: Project }) {
  const { data: tasks = [], isLoading } = useProjectTasks(project.id)

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex-1 h-[220px] rounded-xl animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
          />
        ))}
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-end mb-4">
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => toast.info('Coming soon')}
        >
          New Task
        </Button>
      </div>

      <div className="flex gap-4">
        {TASK_COLUMNS.map((col) => {
          const columnTasks = tasks.filter((t) => t.status === col.status)
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
                  {columnTasks.length}
                </span>
              </div>

              <div className="flex flex-col gap-2">
                {columnTasks.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
                {columnTasks.length === 0 && (
                  <p
                    className="text-[12px] py-6 text-center"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    No tasks
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
