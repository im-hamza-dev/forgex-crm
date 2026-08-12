'use client'

import { useState } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
  getProjectTagColor,
} from '@/constants/task-config'
import type { Task } from '@/types/tasks'

interface TasksTableProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

export function TasksTable({ tasks, onTaskClick }: TasksTableProps) {
  const [checked, setChecked] = useState<Set<string>>(
    new Set(tasks.filter((t) => t.status === 'done').map((t) => t.id)),
  )

  const toggleCheck = (id: string) => {
    const next = new Set(checked)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    setChecked(next)
  }

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
              { label: 'Project', cls: 'text-left w-[180px]' },
              { label: 'Priority', cls: 'text-left w-[120px]' },
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
            const isChecked = checked.has(task.id)
            const priority = TASK_PRIORITY_CONFIG[task.priority]
            const status = TASK_STATUS_CONFIG[task.status]
            const projectColor = getProjectTagColor(task.project_name)

            const shortProjectName =
              task.project_name
                ?.replace(' System', '')
                ?.replace(' Platform', '')
                ?.replace(' MVP', '') ?? null

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
                    checked={isChecked}
                    onChange={() => toggleCheck(task.id)}
                    className="w-4 h-4 rounded accent-[var(--color-accent)] cursor-pointer"
                    aria-label={`Complete: ${task.title}`}
                  />
                </td>

                <td className="py-4 pr-4">
                  <span
                    className="text-[14px] font-medium"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {task.title}
                  </span>
                </td>

                <td className="py-4 pr-4 w-[180px]">
                  {task.project_name ? (
                    <span
                      className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold truncate max-w-[160px]"
                      style={{
                        background: projectColor.bg,
                        color: projectColor.text,
                      }}
                    >
                      {shortProjectName ?? task.project_name}
                    </span>
                  ) : (
                    <span style={{ color: 'var(--color-text-muted)' }}>—</span>
                  )}
                </td>

                <td className="py-4 pr-4 w-[120px]">
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
                    style={{ color: 'var(--color-text-muted)' }}
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
                    aria-label="Task actions"
                  >
                    <MoreHorizontal size={14} />
                  </button>
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
