'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Button, Select } from '@/components/ui'
import { TaskDrawer, NewTaskModal } from '@/components/tasks'
import { TASK_PRIORITY_CONFIG } from '@/constants/task-config'
import { useProjectMilestones } from '@/hooks/useProjects'
import { useProjectTasks } from '@/hooks/useTasks'
import type { Project } from '@/types/projects'
import type { Task, TaskStatus } from '@/types/tasks'

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
  { status: 'review', label: 'Review', dotColor: '#8B5E00' },
  { status: 'done', label: 'Done', dotColor: 'var(--color-success)' },
]

function ProjectTaskCard({
  task,
  onClick,
}: {
  task: Task
  onClick: () => void
}) {
  const priority = TASK_PRIORITY_CONFIG[task.priority]
  const assigneeName = task.assigned_profile?.full_name

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
      className={cn(
        'bg-[var(--color-surface)] border rounded-[10px] p-3.5 cursor-pointer',
        'transition-shadow hover:shadow-[0_2px_8px_rgba(26,16,8,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
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
              src={task.assigned_profile?.avatar_url}
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
  const { data: milestones = [] } = useProjectMilestones(project.id)
  const [milestoneFilter, setMilestoneFilter] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const filtered = milestoneFilter
    ? tasks.filter((t) => t.milestone_id === milestoneFilter)
    : tasks

  if (isLoading) {
    return (
      <div className="flex gap-4">
        {[1, 2, 3, 4].map((i) => (
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
      <div className="flex items-center justify-between gap-3 mb-4">
        {milestones.length > 0 ? (
          <Select
            options={[
              { value: '', label: 'All milestones' },
              ...milestones.map((m) => ({ value: m.id, label: m.title })),
            ]}
            value={milestoneFilter}
            onChange={(e) => setMilestoneFilter(e.target.value)}
            className="w-[200px]"
          />
        ) : (
          <div />
        )}
        <Button
          variant="primary"
          size="sm"
          icon={<Plus size={14} />}
          onClick={() => setModalOpen(true)}
        >
          New Task
        </Button>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {TASK_COLUMNS.map((col) => {
          const columnTasks = filtered.filter((t) => t.status === col.status)
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
                  <ProjectTaskCard
                    key={task.id}
                    task={task}
                    onClick={() => {
                      setDrawerTaskId(task.id)
                      setDrawerOpen(true)
                    }}
                  />
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

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultProjectId={project.id}
      />

      <TaskDrawer
        taskId={drawerTaskId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setDrawerTaskId(null)
        }}
        projectId={project.id}
      />
    </div>
  )
}
