'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Eye, EyeOff, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Button, Modal, toast } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  useCreateProjectUpdate,
  useDeleteProjectUpdate,
  useProjectUpdates,
  useToggleUpdateVisibility,
} from '@/hooks/useProjects'
import {
  canDeleteUpdate,
  canToggleClientVisibility,
} from '@/lib/project-permissions'
import type { Project } from '@/types/projects'

export function ProjectUpdatesTab({ project }: { project: Project }) {
  const { profile } = useAuth()
  const { data: updates = [], isLoading } = useProjectUpdates(project.id)
  const createUpdate = useCreateProjectUpdate()
  const toggleVisibility = useToggleUpdateVisibility()
  const deleteUpdate = useDeleteProjectUpdate()

  const [updateText, setUpdateText] = useState('')
  const [visibleToClient, setVisibleToClient] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const canToggle = canToggleClientVisibility(profile)

  const handlePost = async () => {
    if (!updateText.trim()) return
    try {
      await createUpdate.mutateAsync({
        projectId: project.id,
        content: updateText.trim(),
        is_client_visible: visibleToClient,
      })
      toast.success('Update posted')
      setUpdateText('')
      setVisibleToClient(false)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to post update',
      )
    }
  }

  const handleToggle = async (updateId: string, next: boolean) => {
    setTogglingId(updateId)
    try {
      await toggleVisibility.mutateAsync({
        projectId: project.id,
        updateId,
        is_client_visible: next,
      })
      toast.success(next ? 'Visible to client' : 'Internal only')
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update visibility',
      )
    } finally {
      setTogglingId(null)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      await deleteUpdate.mutateAsync({
        projectId: project.id,
        updateId: deleteId,
      })
      toast.success('Update deleted')
      setDeleteId(null)
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to delete update',
      )
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div
        className={cn(
          'rounded-xl border bg-[var(--color-surface)] p-4',
          createUpdate.isPending && 'opacity-60 pointer-events-none',
        )}
        style={{ borderColor: 'var(--color-border)' }}
      >
        <textarea
          value={updateText}
          onChange={(e) => setUpdateText(e.target.value)}
          placeholder="Post an update..."
          rows={3}
          className={cn(
            'w-full text-[14px] resize-none bg-transparent outline-none',
            'placeholder:text-[var(--color-text-muted)]',
          )}
          style={{ color: 'var(--color-text-body)' }}
        />
        <div
          className="flex items-center justify-between mt-3 pt-3 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {canToggle ? (
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <Eye size={14} style={{ color: 'var(--color-text-muted)' }} />
              <span
                className="text-[12px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Visible to client
              </span>
              <input
                type="checkbox"
                checked={visibleToClient}
                onChange={(e) => setVisibleToClient(e.target.checked)}
                className="w-4 h-4 accent-[var(--color-accent)]"
              />
            </label>
          ) : (
            <span />
          )}
          <Button
            variant="primary"
            size="sm"
            disabled={!updateText.trim()}
            loading={createUpdate.isPending}
            onClick={() => void handlePost()}
          >
            Post Update
          </Button>
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-[120px] rounded-xl animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
            />
          ))}
        </div>
      )}

      {!isLoading && updates.length === 0 && (
        <p
          className="py-10 text-center text-[14px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          No updates yet
        </p>
      )}

      {updates.map((update) => {
        const authorName = update.author?.full_name ?? 'Team'
        const canDelete = canDeleteUpdate(profile, update.author_id)

        return (
          <div
            key={update.id}
            className="rounded-xl border bg-[var(--color-surface)] p-5"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <div className="flex items-start justify-between mb-2 gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <Avatar
                  name={authorName}
                  src={update.author?.avatar_url}
                  size="sm"
                />
                <span
                  className="text-[13px] font-semibold"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  {authorName}
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {formatDistanceToNow(new Date(update.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                  style={
                    update.is_client_visible
                      ? {
                          background: 'var(--color-info-bg)',
                          color: 'var(--color-info)',
                        }
                      : {
                          background: 'var(--color-surface-hover)',
                          color: 'var(--color-text-muted)',
                        }
                  }
                >
                  {update.is_client_visible ? (
                    <>
                      <Eye size={10} />
                      Client can see
                    </>
                  ) : (
                    'Internal'
                  )}
                </span>
                {canToggle && (
                  <button
                    type="button"
                    aria-label="Toggle client visibility"
                    disabled={togglingId === update.id}
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-40"
                    onClick={() =>
                      void handleToggle(update.id, !update.is_client_visible)
                    }
                  >
                    {togglingId === update.id ? (
                      <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin block" />
                    ) : update.is_client_visible ? (
                      <EyeOff size={13} />
                    ) : (
                      <Eye size={13} />
                    )}
                  </button>
                )}
                {canDelete && (
                  <button
                    type="button"
                    aria-label="Delete update"
                    className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
                    onClick={() => setDeleteId(update.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
            <p
              className="text-[14px] leading-relaxed whitespace-pre-wrap"
              style={{ color: 'var(--color-text-body)' }}
            >
              {update.content}
            </p>
          </div>
        )
      })}

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete update?"
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
              loading={deleteUpdate.isPending}
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
          Remove this update from the feed?
        </p>
      </Modal>
    </div>
  )
}
