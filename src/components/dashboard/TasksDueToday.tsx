import Link from 'next/link'
import { Avatar } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const PRIORITY_DOTS: Record<string, string> = {
  Urgent: 'bg-[var(--color-priority-urgent)]',
  High: 'bg-[var(--color-priority-high)]',
  Medium: 'bg-[var(--color-priority-medium)]',
  Low: 'bg-[var(--color-priority-low)]',
}

const PROJECT_COLORS: Record<string, { text: string; bg: string }> = {
  'Patient Acquisition System': {
    text: 'text-[var(--color-project-pas)]',
    bg: 'bg-[var(--color-project-pas-bg)]',
  },
  'B2B Pipeline OS': {
    text: 'text-[var(--color-project-b2b)]',
    bg: 'bg-[var(--color-project-b2b-bg)]',
  },
  'Coaching Growth Platform': {
    text: 'text-[var(--color-project-cgp)]',
    bg: 'bg-[var(--color-project-cgp-bg)]',
  },
}

interface Task {
  title: string
  project: string
  priority: 'Urgent' | 'High' | 'Medium' | 'Low'
  assigneeName: string
  assigneeAvatar?: string | null
  due: string
  overdue?: boolean
}

interface TasksDueTodayProps {
  tasks: Task[]
}

export function TasksDueToday({ tasks }: TasksDueTodayProps) {
  return (
    <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden">
      <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border)]">
        <h3 className="text-[15px] font-semibold text-[var(--color-text-heading)]">
          Due Today
        </h3>
        <Link
          href={ROUTES.TASKS}
          className="text-[13px] font-medium transition-opacity hover:opacity-70 text-[var(--color-accent)]"
        >
          View all tasks →
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px]">
          <thead>
            <tr className="border-b border-[var(--color-border)]">
              <th className="w-10 pl-5 pr-2 py-3" />
              <th className="text-left py-3 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                Task
              </th>
              <th className="text-left py-3 w-[200px] text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                Project
              </th>
              <th className="text-left py-3 w-[110px] text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                Priority
              </th>
              <th className="text-left py-3 w-[80px] text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                Assignee
              </th>
              <th className="text-left py-3 pr-5 w-[100px] text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-text-muted)]">
                Due
              </th>
            </tr>
          </thead>
          <tbody>
            {tasks.map((task, i) => {
              const dotClass = PRIORITY_DOTS[task.priority] ?? 'bg-[var(--color-stage-new-dot)]'
              const proj = PROJECT_COLORS[task.project] ?? {
                text: 'text-[var(--color-stage-new)]',
                bg: 'bg-[var(--color-stage-new-bg)]',
              }

              return (
                <tr
                  key={`${task.title}-${i}`}
                  className={cn(
                    'group transition-colors hover:bg-[var(--color-surface-hover)]',
                    i < tasks.length - 1 && 'border-b border-[var(--color-border)]',
                  )}
                >
                  <td className="pl-5 pr-2 py-3.5 w-10">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded accent-[var(--color-accent)] cursor-pointer"
                      aria-label={`Complete: ${task.title}`}
                    />
                  </td>

                  <td className="py-3.5 pr-4">
                    <span className="text-[14px] font-medium text-[var(--color-text-body)]">
                      {task.title}
                    </span>
                  </td>

                  <td className="py-3.5 pr-4 w-[200px]">
                    <span
                      className={cn(
                        'inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold truncate max-w-[180px]',
                        proj.bg,
                        proj.text,
                      )}
                    >
                      {task.project}
                    </span>
                  </td>

                  <td className="py-3.5 pr-4 w-[110px]">
                    <span className="flex items-center gap-1.5">
                      <span className={cn('w-1.5 h-1.5 rounded-full shrink-0', dotClass)} />
                      <span className="text-[13px] text-[var(--color-text-body)]">
                        {task.priority}
                      </span>
                    </span>
                  </td>

                  <td className="py-3.5 pr-4 w-[80px]">
                    <Avatar
                      name={task.assigneeName}
                      src={task.assigneeAvatar}
                      size="xs"
                    />
                  </td>

                  <td className="py-3.5 pr-5 w-[100px]">
                    <span
                      className={cn(
                        'text-[12px] tabular-nums',
                        task.overdue
                          ? 'text-[var(--color-danger)]'
                          : 'text-[var(--color-text-muted)]',
                      )}
                    >
                      {task.due}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
