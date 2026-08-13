'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Button, Select, toast } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  useCreateTask,
  useCreateTaskComment,
  useDeleteTask,
  useDeleteTaskComment,
  useTask,
  useTaskComments,
  useUpdateTask,
} from '@/hooks/useTasks'
import { useProjectMilestones } from '@/hooks/useProjects'
import {
  canAssignTask,
  canDeleteComment,
  canDeleteTask,
  canEditTask,
} from '@/lib/task-permissions'
import {
  TASK_PRIORITY_CONFIG,
  TASK_STATUS_CONFIG,
} from '@/constants/task-config'
import type { TaskPriority, TaskStatus } from '@/types/tasks'

interface TaskDrawerProps {
  taskId: string | null
  open: boolean
  onClose: () => void
  projectId?: string
}

const STATUSES: TaskStatus[] = ['todo', 'in_progress', 'review', 'done']
const PRIORITIES: TaskPriority[] = ['low', 'medium', 'high', 'urgent']

function formatDate(iso: string | null | undefined) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function TaskDrawer({
  taskId,
  open,
  onClose,
}: TaskDrawerProps) {
  const { profile } = useAuth()
  const { data: task, isLoading } = useTask(open ? taskId : null)
  const { data: comments = [] } = useTaskComments(open ? taskId : null)
  const updateTask = useUpdateTask()
  const deleteTask = useDeleteTask()
  const createTask = useCreateTask()
  const createComment = useCreateTaskComment()
  const deleteComment = useDeleteTaskComment()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [comment, setComment] = useState('')
  const [subtaskTitle, setSubtaskTitle] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [teamOptions, setTeamOptions] = useState<
    { value: string; label: string }[]
  >([{ value: '', label: 'Unassigned' }])

  const projectIdForMilestones = task?.project_id ?? undefined
  const { data: milestones = [] } = useProjectMilestones(
    projectIdForMilestones ?? '',
  )

  const canEdit = task ? canEditTask(profile, task) : false
  const canDelete = task ? canDeleteTask(profile, task) : false
  const canAssign = canAssignTask(profile)
  const canEditActual =
    canEdit ||
    (profile != null && task?.assigned_to === profile.id)

  useEffect(() => {
    if (task) {
      setTitle(task.title)
      setDescription(task.description ?? '')
    }
  }, [task])

  useEffect(() => {
    if (!open || !canAssign) return
    const supabase = createClient()
    void supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .then(({ data }) => {
        setTeamOptions([
          { value: '', label: 'Unassigned' },
          ...(data ?? []).map((p) => ({
            value: p.id,
            label: p.full_name ?? p.id,
          })),
        ])
      })
  }, [open, canAssign])

  useEffect(() => {
    if (!open) {
      setConfirmDelete(false)
      setComment('')
      setSubtaskTitle('')
    }
  }, [open])

  if (!open) return null

  const saveField = async (data: Record<string, unknown>) => {
    if (!taskId) return
    try {
      await updateTask.mutateAsync({ id: taskId, data })
      toast.success('Saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Update failed')
    }
  }

  const handleDelete = async () => {
    if (!taskId) return
    try {
      await deleteTask.mutateAsync(taskId)
      toast.success('Task deleted')
      setConfirmDelete(false)
      onClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleAddComment = async () => {
    if (!taskId || !comment.trim()) return
    try {
      await createComment.mutateAsync({
        taskId,
        content: comment.trim(),
      })
      setComment('')
      toast.success('Comment added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add comment')
    }
  }

  const handleAddSubtask = async () => {
    if (!taskId || !subtaskTitle.trim() || !task) return
    try {
      await createTask.mutateAsync({
        title: subtaskTitle.trim(),
        parent_task_id: taskId,
        project_id: task.project_id,
        assigned_to: task.assigned_to,
        priority: task.priority,
      })
      setSubtaskTitle('')
      toast.success('Subtask added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add subtask')
    }
  }

  const subtasks = task?.subtasks ?? []

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-[var(--color-overlay-drawer)]"
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 z-[100]',
          'flex flex-col w-[480px]',
          'bg-[var(--color-surface)]',
          'border-l border-[var(--color-border)]',
          'shadow-[-8px_0_32px_rgba(26,16,8,0.08)]',
        )}
      >
        {isLoading || !task ? (
          <div className="p-5 space-y-4">
            <div className="h-8 rounded-lg animate-pulse bg-[var(--color-surface-hover)]" />
            <div className="h-10 rounded-lg animate-pulse bg-[var(--color-surface-hover)]" />
            <div className="h-40 rounded-lg animate-pulse bg-[var(--color-surface-hover)]" />
          </div>
        ) : (
          <>
            <div className="flex items-start gap-3 px-5 py-4 border-b border-[var(--color-border)] shrink-0">
              <button
                type="button"
                onClick={onClose}
                className={cn(
                  'flex items-center justify-center w-7 h-7 rounded-lg shrink-0 mt-0.5',
                  'text-[var(--color-text-muted)] transition-colors',
                  'hover:bg-[var(--color-surface-hover)]',
                )}
                aria-label="Close drawer"
              >
                <X size={15} />
              </button>

              {canEdit ? (
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  onBlur={() => {
                    if (title.trim() && title !== task.title) {
                      void saveField({ title: title.trim() })
                    }
                  }}
                  className={cn(
                    'flex-1 text-[16px] font-bold bg-transparent outline-none',
                    'text-[var(--color-text-heading)]',
                    'focus:underline focus:decoration-[var(--color-accent)]',
                    task.status === 'done' && 'line-through opacity-70',
                  )}
                />
              ) : (
                <span
                  className={cn(
                    'flex-1 text-[16px] font-bold truncate',
                    'text-[var(--color-text-heading)]',
                    task.status === 'done' && 'line-through opacity-70',
                  )}
                >
                  {task.title}
                </span>
              )}

              {updateTask.isPending && (
                <span className="flex items-center gap-1.5 shrink-0 mt-1">
                  <span className="w-3 h-3 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                  <span className="text-[11px] text-[var(--color-text-muted)]">
                    Saving...
                  </span>
                </span>
              )}

              {canDelete && (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-lg shrink-0',
                    'text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]',
                  )}
                  aria-label="Delete task"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto min-h-0 px-5 py-4 space-y-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2 text-[var(--color-text-muted)]">
                  Status
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {STATUSES.map((s) => {
                    const cfg = TASK_STATUS_CONFIG[s]
                    const active = task.status === s
                    return (
                      <button
                        key={s}
                        type="button"
                        disabled={!canEdit || updateTask.isPending}
                        onClick={() => {
                          if (s !== task.status) void saveField({ status: s })
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors',
                          'disabled:opacity-50',
                          active
                            ? 'ring-1 ring-[var(--color-border)]'
                            : 'opacity-60 hover:opacity-100',
                        )}
                        style={{ color: cfg?.textColor }}
                      >
                        {cfg?.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2 text-[var(--color-text-muted)]">
                  Priority
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {PRIORITIES.map((p) => {
                    const cfg = TASK_PRIORITY_CONFIG[p]
                    const active = task.priority === p
                    return (
                      <button
                        key={p}
                        type="button"
                        disabled={!canEdit || updateTask.isPending}
                        onClick={() => {
                          if (p !== task.priority)
                            void saveField({ priority: p })
                        }}
                        className={cn(
                          'px-2.5 py-1 rounded-full text-[12px] font-medium transition-colors',
                          'disabled:opacity-50',
                          active
                            ? 'ring-1 ring-[var(--color-border)]'
                            : 'opacity-60 hover:opacity-100',
                        )}
                        style={{ color: cfg?.color }}
                      >
                        {cfg?.label}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                    Assigned to
                  </p>
                  {canAssign ? (
                    <Select
                      options={teamOptions}
                      value={task.assigned_to ?? ''}
                      onChange={(e) => {
                        void saveField({
                          assigned_to: e.target.value || null,
                        })
                      }}
                    />
                  ) : (
                    <div className="flex items-center gap-2">
                      {task.assigned_profile?.full_name ? (
                        <>
                          <Avatar
                            name={task.assigned_profile.full_name}
                            src={task.assigned_profile.avatar_url}
                            size="xs"
                          />
                          <span className="text-[13px] text-[var(--color-text-body)]">
                            {task.assigned_profile.full_name}
                          </span>
                        </>
                      ) : (
                        <span className="text-[13px] text-[var(--color-text-muted)]">
                          Unassigned
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                    Due date
                  </p>
                  {canEdit ? (
                    <input
                      type="date"
                      defaultValue={task.due_date ?? ''}
                      disabled={updateTask.isPending}
                      onBlur={(e) => {
                        const v = e.target.value || null
                        if (v !== task.due_date) {
                          void saveField({ due_date: v })
                        }
                      }}
                      className={cn(
                        'w-full h-[40px] px-3 rounded-lg text-[13px]',
                        'border border-[var(--color-border)] outline-none',
                        'focus:border-[var(--color-accent)]',
                        'disabled:opacity-50',
                        'bg-[var(--color-surface)] text-[var(--color-text-body)]',
                      )}
                    />
                  ) : (
                    <span className="text-[13px] text-[var(--color-text-body)]">
                      {formatDate(task.due_date)}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                    Project
                  </p>
                  {task.project ? (
                    <Link
                      href={`/projects/${task.project.id}`}
                      className="text-[13px] font-medium text-[var(--color-accent)] hover:underline"
                    >
                      {task.project.name}
                    </Link>
                  ) : (
                    <span className="text-[13px] text-[var(--color-text-muted)]">
                      —
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                    Milestone
                  </p>
                  {canEdit && task.project_id ? (
                    <Select
                      options={[
                        { value: '', label: 'None' },
                        ...milestones.map((m) => ({
                          value: m.id,
                          label: m.title,
                        })),
                      ]}
                      value={task.milestone_id ?? ''}
                      onChange={(e) => {
                        void saveField({
                          milestone_id: e.target.value || null,
                        })
                      }}
                    />
                  ) : (
                    <span className="text-[13px] text-[var(--color-text-body)]">
                      {task.milestone?.title ?? '—'}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                    Estimated hours
                  </p>
                  {canEdit ? (
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      defaultValue={task.estimated_hours ?? ''}
                      disabled={updateTask.isPending}
                      onBlur={(e) => {
                        const raw = e.target.value
                        const num = raw === '' ? null : Number(raw)
                        if (num !== task.estimated_hours) {
                          void saveField({ estimated_hours: num })
                        }
                      }}
                      className={cn(
                        'w-full h-[40px] px-3 rounded-lg text-[13px]',
                        'border border-[var(--color-border)] outline-none',
                        'focus:border-[var(--color-accent)]',
                        'disabled:opacity-50',
                        'bg-[var(--color-surface)] text-[var(--color-text-body)]',
                      )}
                    />
                  ) : (
                    <span className="text-[13px] text-[var(--color-text-body)]">
                      {task.estimated_hours ?? '—'}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                    Actual hours
                  </p>
                  {canEditActual ? (
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      defaultValue={task.actual_hours ?? ''}
                      disabled={updateTask.isPending}
                      onBlur={(e) => {
                        const raw = e.target.value
                        const num = raw === '' ? null : Number(raw)
                        if (num !== task.actual_hours) {
                          void saveField({ actual_hours: num })
                        }
                      }}
                      className={cn(
                        'w-full h-[40px] px-3 rounded-lg text-[13px]',
                        'border border-[var(--color-border)] outline-none',
                        'focus:border-[var(--color-accent)]',
                        'disabled:opacity-50',
                        'bg-[var(--color-surface)] text-[var(--color-text-body)]',
                      )}
                    />
                  ) : (
                    <span className="text-[13px] text-[var(--color-text-body)]">
                      {task.actual_hours ?? '—'}
                    </span>
                  )}
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                    Created by
                  </p>
                  <div className="flex items-center gap-2">
                    {task.created_profile?.full_name && (
                      <Avatar
                        name={task.created_profile.full_name}
                        src={task.created_profile.avatar_url}
                        size="xs"
                      />
                    )}
                    <span className="text-[13px] text-[var(--color-text-body)]">
                      {task.created_profile?.full_name ?? '—'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                    Created at
                  </p>
                  <span className="text-[13px] text-[var(--color-text-body)]">
                    {formatDate(task.created_at)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                  Description
                </p>
                {canEdit ? (
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    onBlur={() => {
                      const next = description || null
                      if (next !== (task.description ?? null)) {
                        void saveField({ description: next })
                      }
                    }}
                    rows={4}
                    disabled={updateTask.isPending}
                    className={cn(
                      'w-full px-3 py-2.5 rounded-lg text-[13px] resize-y',
                      'border border-[var(--color-border)] outline-none',
                      'focus:border-[var(--color-accent)]',
                      'disabled:opacity-50',
                      'bg-[var(--color-surface)] text-[var(--color-text-body)]',
                    )}
                    placeholder="Add a description..."
                  />
                ) : (
                  <p className="text-[13px] whitespace-pre-wrap text-[var(--color-text-body)]">
                    {task.description || '—'}
                  </p>
                )}
              </div>

              {!task.parent_task_id && (
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2 text-[var(--color-text-muted)]">
                    Subtasks
                  </p>
                  <div className="space-y-2 mb-3">
                    {subtasks.map((st) => (
                      <div
                        key={st.id}
                        className="flex items-center gap-2 py-1.5"
                      >
                        <input
                          type="checkbox"
                          checked={st.status === 'done'}
                          disabled={!canEdit}
                          onChange={() => {
                            void updateTask.mutateAsync({
                              id: st.id,
                              data: {
                                status:
                                  st.status === 'done' ? 'todo' : 'done',
                              },
                            }).then(() => {
                              toast.success('Subtask updated')
                            }).catch((err: unknown) => {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : 'Update failed',
                              )
                            })
                          }}
                          className="w-4 h-4 rounded accent-[var(--color-accent)]"
                        />
                        <span
                          className={cn(
                            'text-[13px] text-[var(--color-text-body)]',
                            st.status === 'done' &&
                              'line-through opacity-60',
                          )}
                        >
                          {st.title}
                        </span>
                      </div>
                    ))}
                    {subtasks.length === 0 && (
                      <p className="text-[12px] text-[var(--color-text-muted)]">
                        No subtasks yet
                      </p>
                    )}
                  </div>
                  {canEdit && (
                    <div className="flex gap-2">
                      <input
                        value={subtaskTitle}
                        onChange={(e) => setSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            void handleAddSubtask()
                          }
                        }}
                        placeholder="Add subtask..."
                        className={cn(
                          'flex-1 h-[36px] px-3 rounded-lg text-[13px]',
                          'border border-[var(--color-border)] outline-none',
                          'bg-[var(--color-surface)] text-[var(--color-text-body)]',
                        )}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        loading={createTask.isPending}
                        onClick={() => void handleAddSubtask()}
                      >
                        Add
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2 text-[var(--color-text-muted)]">
                  Comments
                </p>
                <div className="space-y-3 mb-3">
                  {comments.map((c) => (
                    <div key={c.id} className="flex gap-2.5 group">
                      <Avatar
                        name={c.author?.full_name ?? 'User'}
                        src={c.author?.avatar_url}
                        size="xs"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[12px] font-semibold text-[var(--color-text-heading)]">
                            {c.author?.full_name ?? 'User'}
                          </span>
                          <span className="text-[11px] text-[var(--color-text-muted)]">
                            {formatTime(c.created_at)}
                          </span>
                          {canDeleteComment(profile, c.author_id) && (
                            <button
                              type="button"
                              className="ml-auto opacity-0 group-hover:opacity-100 text-[11px] text-[var(--color-danger)]"
                              onClick={() => {
                                if (!taskId) return
                                void deleteComment
                                  .mutateAsync({
                                    taskId,
                                    commentId: c.id,
                                  })
                                  .then(() => toast.success('Comment deleted'))
                                  .catch((err: unknown) =>
                                    toast.error(
                                      err instanceof Error
                                        ? err.message
                                        : 'Delete failed',
                                    ),
                                  )
                              }}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                        <p className="text-[13px] whitespace-pre-wrap text-[var(--color-text-body)]">
                          {c.content}
                        </p>
                      </div>
                    </div>
                  ))}
                  {comments.length === 0 && (
                    <p className="text-[12px] text-[var(--color-text-muted)]">
                      No comments yet
                    </p>
                  )}
                </div>
                <div className="flex flex-col gap-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={2}
                    placeholder="Write a comment..."
                    className={cn(
                      'w-full px-3 py-2.5 rounded-lg text-[13px] resize-y',
                      'border border-[var(--color-border)] outline-none',
                      'bg-[var(--color-surface)] text-[var(--color-text-body)]',
                    )}
                  />
                  <Button
                    variant="primary"
                    size="sm"
                    className="self-end"
                    loading={createComment.isPending}
                    disabled={!comment.trim()}
                    onClick={() => void handleAddComment()}
                  >
                    Comment
                  </Button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {confirmDelete && task && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative z-10 bg-[var(--color-surface)] rounded-2xl shadow-xl p-6 w-[340px] flex flex-col gap-4">
            <h3 className="text-[16px] font-bold text-[var(--color-text-heading)]">
              Delete task?
            </h3>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              This will permanently delete{' '}
              <span className="font-semibold text-[var(--color-text-heading)]">
                {task.title}
              </span>
              . This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={deleteTask.isPending}
                className="h-[38px] px-4 rounded-lg text-[13px] font-medium border border-[var(--color-border)] text-[var(--color-text-body)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={deleteTask.isPending}
                onClick={() => void handleDelete()}
                className="h-[38px] px-4 rounded-lg text-[13px] font-semibold text-white bg-[var(--color-danger)] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
              >
                {deleteTask.isPending && (
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                {deleteTask.isPending ? 'Deleting...' : 'Delete task'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
