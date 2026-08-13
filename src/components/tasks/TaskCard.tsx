'use client'

import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { TASK_PRIORITY_CONFIG } from '@/constants/task-config'
import type { Task } from '@/types/tasks'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false
  const today = new Date().toISOString().split('T')[0]!
  return task.due_date < today
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const priority = TASK_PRIORITY_CONFIG[task.priority]
  const assigneeName = task.assigned_profile?.full_name
  const subtotal = task.subtask_count ?? 0
  const subdone = task.subtask_done_count ?? 0
  const overdue = isOverdue(task)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => e.key === 'Enter' && onClick?.()}
      className={cn(
        'w-full text-left',
        'bg-[var(--color-surface)]',
        'border border-[var(--color-border)]',
        'rounded-[10px] p-4',
        'cursor-pointer select-none',
        'transition-shadow hover:shadow-[0_2px_8px_rgba(26,16,8,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
        task.status === 'done' && 'opacity-70',
      )}
    >
      <p
        className={cn(
          'text-[14px] font-semibold mb-1.5 leading-snug',
          task.status === 'done' && 'line-through',
        )}
        style={{ color: 'var(--color-text-heading)' }}
      >
        {task.title}
      </p>

      {task.project?.name && (
        <span
          className="inline-block mb-2 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{
            background: 'var(--color-accent-subtle)',
            color: 'var(--color-accent)',
          }}
        >
          {task.project.name}
        </span>
      )}

      {subtotal > 0 && (
        <p
          className="text-[12px] mb-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {subdone}/{subtotal} subtasks
        </p>
      )}

      <div className="flex items-center justify-between mt-2.5">
        <span className="flex items-center gap-1.5">
          <span
            className="w-1.5 h-1.5 rounded-full shrink-0"
            style={{ background: priority?.color }}
          />
          <span
            className="text-[12px] font-medium"
            style={{ color: priority?.color }}
          >
            {priority?.label}
          </span>
        </span>

        <span className="flex items-center gap-2">
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
              style={{
                color: overdue
                  ? 'var(--color-danger)'
                  : 'var(--color-text-muted)',
              }}
            >
              {task.due_date}
            </span>
          )}
        </span>
      </div>
    </div>
  )
}
