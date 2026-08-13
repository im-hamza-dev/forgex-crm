'use client'

import { useEffect, useMemo, useState } from 'react'
import { Plus, Search } from 'lucide-react'
import { DashboardShell } from '@/components/layout'
import { Button, SegmentedControl, Select, toast } from '@/components/ui'
import {
  TasksKanban,
  TasksTable,
  TasksStatsRow,
  NewTaskModal,
  TaskDrawer,
} from '@/components/tasks'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useProjects } from '@/hooks/useProjects'
import {
  useDeleteTask,
  useTasks,
  useUpdateTask,
} from '@/hooks/useTasks'
import { canViewAllTasks } from '@/lib/task-permissions'
import type { Task, TaskFilters } from '@/types/tasks'

type TasksView = 'kanban' | 'list'

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delayMs)
    return () => clearTimeout(t)
  }, [value, delayMs])
  return debounced
}

function todayIso() {
  return new Date().toISOString().split('T')[0]!
}

function weekEndIso() {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  return d.toISOString().split('T')[0]!
}

export default function TasksPage() {
  const { profile } = useAuth()
  const showAllFilters = canViewAllTasks(profile)
  const [view, setView] = useState<TasksView>('kanban')
  const [modalOpen, setModalOpen] = useState(false)
  const [drawerTaskId, setDrawerTaskId] = useState<string | null>(null)
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [priority, setPriority] = useState('')
  const [projectId, setProjectId] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [confirmDelete, setConfirmDelete] = useState<Task | null>(null)

  const debouncedSearch = useDebouncedValue(search, 300)
  const { data: projects = [] } = useProjects()
  const [teamOptions, setTeamOptions] = useState<
    { value: string; label: string }[]
  >([{ value: '', label: 'All assignees' }])

  const filters: TaskFilters = useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status: status || undefined,
      priority: priority || undefined,
      project_id: projectId || undefined,
      assigned_to: assignedTo || undefined,
    }),
    [debouncedSearch, status, priority, projectId, assignedTo],
  )

  const { data: tasks = [], isLoading } = useTasks(filters)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()

  useEffect(() => {
    if (!showAllFilters) return
    const supabase = createClient()
    void supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .then(({ data }) => {
        setTeamOptions([
          { value: '', label: 'All assignees' },
          ...(data ?? []).map((p) => ({
            value: p.id,
            label: p.full_name ?? p.id,
          })),
        ])
      })
  }, [showAllFilters])

  const today = todayIso()
  const weekEnd = weekEndIso()
  const dueToday = tasks.filter(
    (t) => t.due_date === today && t.status !== 'done',
  ).length
  const overdue = tasks.filter(
    (t) => t.due_date && t.due_date < today && t.status !== 'done',
  ).length
  const thisWeek = tasks.filter(
    (t) =>
      t.due_date &&
      t.due_date >= today &&
      t.due_date <= weekEnd &&
      t.status !== 'done',
  ).length

  const handleTaskClick = (task: Task) => {
    setDrawerTaskId(task.id)
    setDrawerOpen(true)
  }

  const handleToggleDone = async (task: Task, done: boolean) => {
    try {
      await updateTask.mutateAsync({
        id: task.id,
        data: { status: done ? 'done' : 'todo' },
      })
      toast.success(done ? 'Marked done' : 'Reopened')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleDelete = async () => {
    if (!confirmDelete) return
    try {
      await deleteTask.mutateAsync(confirmDelete.id)
      toast.success('Task deleted')
      if (drawerTaskId === confirmDelete.id) {
        setDrawerOpen(false)
        setDrawerTaskId(null)
      }
      setConfirmDelete(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  return (
    <DashboardShell title="Tasks" notificationCount={0}>
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
            onClick={() => setModalOpen(true)}
            className="rounded-lg"
          >
            New Task
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <div className="relative flex-1 min-w-[200px] max-w-[280px]">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)]"
          />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tasks..."
            className="w-full h-[36px] pl-9 pr-3 rounded-lg text-[13px] border border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-body)] outline-none focus:border-[var(--color-accent)]"
          />
        </div>
        <Select
          options={[
            { value: '', label: 'All statuses' },
            { value: 'todo', label: 'Todo' },
            { value: 'in_progress', label: 'In Progress' },
            { value: 'review', label: 'Review' },
            { value: 'done', label: 'Done' },
          ]}
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-[150px]"
        />
        <Select
          options={[
            { value: '', label: 'All priorities' },
            { value: 'low', label: 'Low' },
            { value: 'medium', label: 'Medium' },
            { value: 'high', label: 'High' },
            { value: 'urgent', label: 'Urgent' },
          ]}
          value={priority}
          onChange={(e) => setPriority(e.target.value)}
          className="w-[150px]"
        />
        {showAllFilters && (
          <>
            <Select
              options={[
                { value: '', label: 'All projects' },
                ...projects.map((p) => ({ value: p.id, label: p.name })),
              ]}
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              className="w-[180px]"
            />
            <Select
              options={teamOptions}
              value={assignedTo}
              onChange={(e) => setAssignedTo(e.target.value)}
              className="w-[160px]"
            />
          </>
        )}
      </div>

      {isLoading && (
        <div className="flex gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 min-w-[220px] space-y-2.5">
              <div className="h-5 w-24 rounded animate-pulse bg-[var(--color-surface-hover)]" />
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-[100px] rounded-[10px] animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
                />
              ))}
            </div>
          ))}
        </div>
      )}

      {!isLoading && tasks.length === 0 && (
        <div className="py-20 text-center">
          <p className="text-[15px] font-medium text-[var(--color-text-heading)] mb-1">
            No tasks found
          </p>
          <p className="text-[13px] text-[var(--color-text-muted)] mb-4">
            Create a task to get started
          </p>
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={15} />}
            onClick={() => setModalOpen(true)}
          >
            New Task
          </Button>
        </div>
      )}

      {!isLoading && tasks.length > 0 && view === 'kanban' && (
        <TasksKanban tasks={tasks} onTaskClick={handleTaskClick} />
      )}

      {!isLoading && tasks.length > 0 && view === 'list' && (
        <TasksTable
          tasks={tasks}
          onTaskClick={handleTaskClick}
          onEdit={handleTaskClick}
          onDelete={(t) => setConfirmDelete(t)}
          onToggleDone={handleToggleDone}
        />
      )}

      <NewTaskModal open={modalOpen} onClose={() => setModalOpen(false)} />

      <TaskDrawer
        taskId={drawerTaskId}
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false)
          setDrawerTaskId(null)
        }}
      />

      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmDelete(null)}
          />
          <div className="relative z-10 bg-[var(--color-surface)] rounded-2xl shadow-xl p-6 w-[340px] flex flex-col gap-4">
            <h3 className="text-[16px] font-bold text-[var(--color-text-heading)]">
              Delete task?
            </h3>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              This will permanently delete{' '}
              <span className="font-semibold text-[var(--color-text-heading)]">
                {confirmDelete.title}
              </span>
              .
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(null)}
                disabled={deleteTask.isPending}
                className="h-[38px] px-4 rounded-lg text-[13px] font-medium border border-[var(--color-border)]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteTask.isPending}
                onClick={() => void handleDelete()}
                className="h-[38px] px-4 rounded-lg text-[13px] font-semibold text-white bg-[var(--color-danger)]"
              >
                {deleteTask.isPending ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
