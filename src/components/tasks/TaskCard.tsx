'use client'

import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { TASK_PRIORITY_CONFIG } from '@/constants/task-config'
import type { Task } from '@/types/tasks'

interface TaskCardProps {
  task: Task
  onClick?: () => void
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const priority = TASK_PRIORITY_CONFIG[task.priority]

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
      )}
    >
      <p
        className="text-[14px] font-semibold mb-1.5 leading-snug"
        style={{ color: 'var(--color-text-heading)' }}
      >
        {task.title}
      </p>

      {task.subtask_total > 0 && (
        <p
          className="text-[12px] mb-2"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {task.subtask_done}/{task.subtask_total} subtasks
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
        </span>
      </div>
    </div>
  )
}
