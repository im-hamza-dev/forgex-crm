'use client'

import { useState } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import {
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
} from '@/constants/task-config'
import { useAuth } from '@/hooks/useAuth'
import { canDeleteTask } from '@/lib/task-permissions'
import type { Task } from '@/types/tasks'

interface TasksTableProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
  onEdit?: (task: Task) => void
  onDelete?: (task: Task) => void
  onToggleDone?: (task: Task, done: boolean) => void
}

function isOverdue(task: Task): boolean {
  if (!task.due_date || task.status === 'done') return false
  const today = new Date().toISOString().split('T')[0]!
  return task.due_date < today
}

export function TasksTable({
  tasks,
  onTaskClick,
  onEdit,
  onDelete,
  onToggleDone,
}: TasksTableProps) {
  const { profile } = useAuth()
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null)

  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)]"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            <th className="w-12 pl-5 py-3" />
            {[
              { label: 'Title', cls: 'text-left' },
              { label: 'Project', cls: 'text-left w-[160px]' },
              { label: 'Assignee', cls: 'text-left w-[150px]' },
              { label: 'Priority', cls: 'text-left w-[110px]' },
              { label: 'Due', cls: 'text-left w-[110px]' },
              { label: 'Status', cls: 'text-left w-[120px]' },
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
          {tasks.map((task, i) => {
            const priority = TASK_PRIORITY_CONFIG[task.priority]
            const status = TASK_STATUS_CONFIG[task.status]
            const overdue = isOverdue(task)
            const assigneeName = task.assigned_profile?.full_name
            const canDelete = canDeleteTask(profile, task)

            return (
              <tr
                key={task.id}
                className="group transition-colors hover:bg-[var(--color-surface-hover)] cursor-pointer"
                style={{
                  borderBottom:
                    i < tasks.length - 1
                      ? '1px solid var(--color-border)'
                      : undefined,
                }}
                onClick={() => onTaskClick?.(task)}
              >
                <td
                  className="pl-5 pr-3 py-4 w-12"
                  onClick={(e) => e.stopPropagation()}
                >
                  <input
                    type="checkbox"
                    checked={task.status === 'done'}
                    onChange={(e) =>
                      onToggleDone?.(task, e.target.checked)
                    }
                    className="w-4 h-4 rounded accent-[var(--color-accent)] cursor-pointer"
                    aria-label={`Complete: ${task.title}`}
                  />
                </td>

                <td className="py-4 pr-4">
                  <span
                    className={cn(
                      'text-[14px] font-medium',
                      task.status === 'done' && 'line-through opacity-70',
                    )}
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {task.title}
                  </span>
                </td>

                <td className="py-4 pr-4 w-[160px]">
                  {task.project?.name ? (
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold truncate max-w-[140px]"
                      style={{
                        background: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      {task.project.name}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                  )}
                </td>

                <td className="py-4 pr-4 w-[150px]">
                  {assigneeName ? (
                    <span className="flex items-center gap-2">
                      <Avatar
                        name={assigneeName}
                        src={task.assigned_profile?.avatar_url}
                        size="xs"
                      />
                      <span
                        className="text-[13px] truncate"
                        style={{ color: 'var(--color-text-body)' }}
                      >
                        {assigneeName}
                      </span>
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                  )}
                </td>

                <td className="py-4 pr-4 w-[110px]">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: priority?.color }}
                    />
                    <span
                      className="text-[13px]"
                      style={{
                        color: priority?.color ?? 'var(--color-text-body)',
                      }}
                    >
                      {priority?.label}
                    </span>
                  </span>
                </td>

                <td className="py-4 pr-4 w-[110px]">
                  <span
                    className="text-[13px] tabular-nums"
                    style={{
                      color: overdue
                        ? 'var(--color-danger)'
                        : 'var(--color-text-muted)',
                    }}
                  >
                    {task.due_date ?? '—'}
                  </span>
                </td>

                <td className="py-4 pr-4 w-[120px]">
                  <span
                    className="text-[13px] font-medium"
                    style={{
                      color: status?.textColor ?? 'var(--color-text-muted)',
                    }}
                  >
                    {status?.label}
                  </span>
                </td>

                <td
                  className="pr-4 w-10 relative"
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
                    aria-label="Task actions"
                    onClick={() =>
                      setMenuOpenId(menuOpenId === task.id ? null : task.id)
                    }
                  >
                    <MoreHorizontal size={14} />
                  </button>
                  {menuOpenId === task.id && (
                    <div
                      className={cn(
                        'absolute right-4 top-10 z-20 min-w-[120px]',
                        'bg-[var(--color-surface)] border border-[var(--color-border)]',
                        'rounded-lg shadow-lg py-1',
                      )}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-text-body)] hover:bg-[var(--color-surface-hover)]"
                        onClick={() => {
                          setMenuOpenId(null)
                          onEdit?.(task)
                        }}
                      >
                        <Pencil size={12} />
                        Edit
                      </button>
                      {canDelete && (
                        <button
                          type="button"
                          className="flex w-full items-center gap-2 px-3 py-2 text-[13px] text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]"
                          onClick={() => {
                            setMenuOpenId(null)
                            onDelete?.(task)
                          }}
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {tasks.length === 0 && (
        <div
          className="py-16 text-center"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <p className="text-[14px]">No tasks yet</p>
        </div>
      )}
    </div>
  )
}
