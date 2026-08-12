import { TaskCard } from './TaskCard'
import { TASK_STATUS_CONFIG } from '@/constants/task-config'
import type { Task, TaskStatus } from '@/types/tasks'

const COLUMNS: TaskStatus[] = ['todo', 'in_progress', 'done']

interface TasksKanbanProps {
  tasks: Task[]
  onTaskClick?: (task: Task) => void
}

export function TasksKanban({ tasks, onTaskClick }: TasksKanbanProps) {
  return (
    <div className="flex gap-5">
      {COLUMNS.map((status) => {
        const config = TASK_STATUS_CONFIG[status]!
        const columnTasks = tasks.filter((t) => t.status === status)

        return (
          <div key={status} className="flex-1 min-w-[240px]">
            <div className="flex items-center gap-2 mb-4">
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
                className="text-[12px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {columnTasks.length}
              </span>
            </div>

            <div className="flex flex-col gap-2.5">
              {columnTasks.map((task) => (
                <TaskCard
                  key={task.id}
                  task={task}
                  onClick={() => onTaskClick?.(task)}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
