'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { DashboardShell } from '@/components/layout'
import { Button, SegmentedControl } from '@/components/ui'
import {
  TasksKanban,
  TasksTable,
  TasksStatsRow,
  NewTaskModal,
} from '@/components/tasks'
import { MOCK_TASKS } from '@/components/tasks/mock-data'
import type { Task } from '@/types/tasks'

type TasksView = 'kanban' | 'list'

export default function TasksPage() {
  const [view, setView] = useState<TasksView>('kanban')
  const [modalOpen, setModal] = useState(false)

  const handleTaskClick = (task: Task) => {
    console.log('Task clicked:', task.title)
  }

  // Static mock stats matching Figma chips
  const dueToday = 5
  const overdue = 0
  const thisWeek = MOCK_TASKS.filter((t) => t.status !== 'done').length

  return (
    <DashboardShell title="Tasks" notificationCount={3}>
      <div className="flex items-center justify-between mb-5">
        <TasksStatsRow
          dueToday={dueToday}
          overdue={overdue}
          thisWeek={thisWeek}
        />
        <div className="flex items-center gap-2">
          <SegmentedControl
            value={view}
            onChange={(v) => setView(v as TasksView)}
            options={[
              { value: 'kanban', label: 'Kanban' },
              { value: 'list', label: 'List' },
            ]}
          />
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={15} />}
            onClick={() => setModal(true)}
            className="rounded-lg"
          >
            New Task
          </Button>
        </div>
      </div>

      {view === 'kanban' && (
        <TasksKanban tasks={MOCK_TASKS} onTaskClick={handleTaskClick} />
      )}

      {view === 'list' && (
        <TasksTable tasks={MOCK_TASKS} onTaskClick={handleTaskClick} />
      )}

      <NewTaskModal
        open={modalOpen}
        onClose={() => setModal(false)}
        onSubmit={(values) => console.log('Create task:', values)}
      />
    </DashboardShell>
  )
}
