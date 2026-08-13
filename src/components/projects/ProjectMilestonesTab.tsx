'use client'

import { useState } from 'react'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Input, Modal, Textarea, toast } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  useCompleteMilestone,
  useCreateMilestone,
  useDeleteMilestone,
  useProjectMilestones,
} from '@/hooks/useProjects'
import {
  canCreateMilestone,
  canDeleteMilestone,
} from '@/lib/project-permissions'
import type { Project } from '@/types/projects'

export function ProjectMilestonesTab({ project }: { project: Project }) {
  const { profile } = useAuth()
  const { data: milestones = [], isLoading } = useProjectMilestones(project.id)
  const createMilestone = useCreateMilestone()
  const completeMilestone = useCompleteMilestone()
  const deleteMilestone = useDeleteMilestone()

  const [showAdd, setShowAdd] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [completingId, setCompletingId] = useState<string | null>(null)

  const canAdd = canCreateMilestone(profile)
  const canDelete = canDeleteMilestone(profile)

  const handleCreate = async () => {
    if (!title.trim()) {
      toast.error('Title is required')
      return
    }
    try {
      await createMilestone.mutateAsync({
        projectId: project.id,
        title: title.trim(),
        description: description.trim() || undefined,
        due_date: dueDate || undefined,
      })
      toast.success('Milestone added')
      setTitle('')
      setDescription('')
      setDueDate('')
      setShowAdd(false)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to add milestone',
      )
    }
  }

  const handleComplete = async (milestoneId: string) => {
    setCompletingId(milestoneId)
    try {
      await completeMilestone.mutateAsync({
        projectId: project.id,
        milestoneId,
      })
      toast.success('Milestone completed')
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to complete milestone',
      )
    } finally {
      setCompletingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteMilestone.mutateAsync({
        projectId: project.id,
        milestoneId: deleteId,
      })
      toast.success('Milestone deleted')
      setDeleteId(null)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete milestone',
      )
    }
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[72px] rounded-xl animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
          />
        ))}
      </div>
    )
  }

  return (
    <>
      <div
        className="rounded-xl border bg-[var(--color-surface)]"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {milestones.length === 0 && !showAdd && (
          <p
            className="py-12 text-center text-[14px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            No milestones yet
          </p>
        )}

        {milestones.map((milestone, i) => {
          const isComplete = !!milestone.completed_at
          const isCompleting = completingId === milestone.id

          return (
            <div
              key={milestone.id}
              className="flex items-start gap-4 px-5 py-4"
              style={{
                borderBottom:
                  i < milestones.length - 1 || showAdd
                    ? '1px solid var(--color-border)'
                    : undefined,
              }}
            >
              <button
                type="button"
                disabled={isComplete || isCompleting}
                onClick={() => void handleComplete(milestone.id)}
                className={cn(
                  'w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 transition-colors',
                  'disabled:cursor-default',
                )}
                style={{
                  borderColor: isComplete
                    ? 'var(--color-accent)'
                    : 'var(--color-border-strong)',
                  background: isComplete
                    ? 'var(--color-accent)'
                    : 'transparent',
                }}
                aria-label={
                  isComplete ? 'Completed' : 'Mark milestone complete'
                }
              />
              <div className="flex-1 min-w-0">
                <p
                  className={cn(
                    'text-[14px] font-semibold',
                    isComplete && 'line-through opacity-60',
                  )}
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  {milestone.title}
                </p>
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {isComplete && milestone.completed_at
                    ? `Completed ${new Date(milestone.completed_at).toLocaleDateString()}`
                    : milestone.due_date
                      ? `Due ${milestone.due_date}`
                      : 'No due date'}
                </p>
                {milestone.description && (
                  <p
                    className="text-[12px] mt-1"
                    style={{ color: 'var(--color-text-secondary)' }}
                  >
                    {milestone.description}
                  </p>
                )}
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {!isComplete && (
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={isCompleting}
                    onClick={() => void handleComplete(milestone.id)}
                  >
                    Complete
                  </Button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    aria-label="Delete milestone"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
                    onClick={() => setDeleteId(milestone.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          )
        })}

        {showAdd && canAdd && (
          <div
            className={cn(
              'px-5 py-4 flex flex-col gap-3',
              createMilestone.isPending && 'opacity-60 pointer-events-none',
            )}
          >
            <Input
              label="Title"
              placeholder="Milestone title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Textarea
              label="Description"
              rows={2}
              placeholder="Optional"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <Input
              label="Due date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
            <div className="flex items-center justify-end gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowAdd(false)
                  setTitle('')
                  setDescription('')
                  setDueDate('')
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                loading={createMilestone.isPending}
                onClick={() => void handleCreate()}
              >
                Add
              </Button>
            </div>
          </div>
        )}

        {canAdd && !showAdd && (
          <button
            type="button"
            onClick={() => setShowAdd(true)}
            className={cn(
              'w-full py-3.5 text-[13px] border-t border-dashed',
              'transition-colors hover:bg-[var(--color-surface-hover)]',
            )}
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
            }}
          >
            + Add Milestone
          </button>
        )}
      </div>

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete milestone?"
        description="This cannot be undone."
        size="sm"
        footer={
          <div className="flex items-center justify-end gap-2 w-full">
            <Button variant="ghost" size="md" onClick={() => setDeleteId(null)}>
              Cancel
            </Button>
            <Button
              variant="danger"
              size="md"
              loading={deleteMilestone.isPending}
              onClick={() => void handleDelete()}
            >
              Delete
            </Button>
          </div>
        }
      >
        <p
          className="text-[13px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          Remove this milestone from the project?
        </p>
      </Modal>
    </>
  )
}
