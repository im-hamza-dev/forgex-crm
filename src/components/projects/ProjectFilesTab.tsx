'use client'

import { useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Download, Eye, EyeOff, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Modal, toast } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  useCreateProjectFile,
  useDeleteProjectFile,
  useProjectFiles,
  useToggleFileVisibility,
} from '@/hooks/useProjects'
import {
  canDeleteProjectFile,
  canToggleClientVisibility,
} from '@/lib/project-permissions'
import type { Project, ProjectFile } from '@/types/projects'

type FileFilter = 'all' | 'client' | 'internal'

function formatBytes(bytes: number | null): string {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function getFileIcon(mimeType: string | null): string {
  if (!mimeType) return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType === 'application/pdf') return '📑'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('sheet') || mimeType.includes('excel')) return '📊'
  if (mimeType.includes('presentation') || mimeType.includes('powerpoint'))
    return '📊'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  return '📄'
}

function canPreview(mimeType: string | null): boolean {
  if (!mimeType) return false
  return mimeType === 'application/pdf' || mimeType.startsWith('image/')
}

function FilePreviewModal({
  file,
  onClose,
}: {
  file: ProjectFile
  onClose: () => void
}) {
  const isPdf = file.mime_type === 'application/pdf'
  const isImage = file.mime_type?.startsWith('image/') ?? false
  const previewable = canPreview(file.mime_type)

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className={cn(
          'relative z-10 flex flex-col',
          'bg-[var(--color-surface)] rounded-2xl shadow-2xl',
          'w-[90vw] max-w-[900px]',
          isPdf ? 'h-[90vh]' : 'max-h-[90vh]',
        )}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <span className="text-[18px]">{getFileIcon(file.mime_type)}</span>
          <div className="flex-1 min-w-0">
            <p className="text-[14px] font-semibold truncate text-[var(--color-text-heading)]">
              {file.file_name}
            </p>
            <p className="text-[11px] text-[var(--color-text-muted)]">
              {formatBytes(file.file_size)} ·{' '}
              {file.uploader?.full_name ?? 'Uploaded'}
            </p>
          </div>
          <a
            href={file.file_url}
            download={file.file_name}
            target="_blank"
            rel="noreferrer"
            className={cn(
              'flex items-center gap-1.5 h-[34px] px-3 rounded-lg',
              'text-[12px] font-medium border border-[var(--color-border)]',
              'text-[var(--color-text-body)] hover:bg-[var(--color-surface-hover)]',
              'transition-colors shrink-0',
            )}
          >
            <Download size={13} />
            Download
          </a>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg shrink-0',
              'text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]',
              'transition-colors',
            )}
            aria-label="Close preview"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-auto min-h-0 rounded-b-2xl">
          {isPdf && (
            <iframe
              src={`${file.file_url}#toolbar=1&navpanes=0`}
              className="w-full h-full rounded-b-2xl"
              title={file.file_name}
            />
          )}
          {isImage && (
            <div className="flex items-center justify-center p-6 h-full">
              <img
                src={file.file_url}
                alt={file.file_name}
                className="max-w-full max-h-full object-contain rounded-lg"
              />
            </div>
          )}
          {!previewable && (
            <div className="flex flex-col items-center justify-center gap-4 py-16 px-6">
              <span className="text-[48px]">{getFileIcon(file.mime_type)}</span>
              <p className="text-[14px] font-semibold text-[var(--color-text-heading)]">
                {file.file_name}
              </p>
              <p className="text-[13px] text-[var(--color-text-muted)] text-center">
                This file type cannot be previewed in the browser. Download it
                instead.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function ProjectFilesTab({ project }: { project: Project }) {
  const { profile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: files = [], isLoading } = useProjectFiles(project.id)
  const createFile = useCreateProjectFile()
  const toggleVisibility = useToggleFileVisibility()
  const deleteFile = useDeleteProjectFile()

  const [filter, setFilter] = useState<FileFilter>('all')
  const [previewFile, setPreviewFile] = useState<ProjectFile | null>(null)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  const canToggle = canToggleClientVisibility(profile)

  const filtered = files.filter((f) => {
    if (filter === 'client') return f.is_client_visible
    if (filter === 'internal') return !f.is_client_visible
    return true
  })

  const filterBtns: { value: FileFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'client', label: 'Client files' },
    { value: 'internal', label: 'Internal' },
  ]

  const handleUpload = async (file: File) => {
    try {
      const supabase = createClient()
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const path = `${project.id}/${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('project-files')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        })

      if (uploadError) {
        toast.error(`Upload failed: ${uploadError.message}`)
        return
      }

      const { data: urlData } = supabase.storage
        .from('project-files')
        .getPublicUrl(path)

      await createFile.mutateAsync({
        projectId: project.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type || null,
        is_client_visible: false,
      })
      toast.success('File uploaded')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const handleToggle = async (file: ProjectFile) => {
    setTogglingId(file.id)
    try {
      await toggleVisibility.mutateAsync({
        projectId: project.id,
        fileId: file.id,
        is_client_visible: !file.is_client_visible,
      })
      toast.success(
        !file.is_client_visible ? 'Visible to client' : 'Internal only',
      )
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
      await deleteFile.mutateAsync({
        projectId: project.id,
        fileId: deleteId,
      })
      toast.success('File deleted')
      setDeleteId(null)
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete file')
    }
  }

  return (
    <>
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {filterBtns.map((btn) => (
              <button
                type="button"
                key={btn.value}
                onClick={() => setFilter(btn.value)}
                className={cn(
                  'h-[32px] px-3 rounded-lg text-[13px] font-medium border transition-colors',
                )}
                style={
                  filter === btn.value
                    ? {
                        background: 'var(--color-action)',
                        color: '#fff',
                        borderColor: 'var(--color-action)',
                      }
                    : {
                        background: 'var(--color-surface)',
                        color: 'var(--color-text-secondary)',
                        borderColor: 'var(--color-border)',
                      }
                }
              >
                {btn.label}
              </button>
            ))}
          </div>
          <div>
            <input
              ref={inputRef}
              type="file"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) void handleUpload(file)
                e.target.value = ''
              }}
            />
            <Button
              variant="primary"
              size="sm"
              loading={createFile.isPending}
              onClick={() => inputRef.current?.click()}
            >
              Upload File
            </Button>
          </div>
        </div>

        {isLoading && (
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[160px] rounded-xl animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
              />
            ))}
          </div>
        )}

        {!isLoading && (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map((file) => {
              const canDelete = canDeleteProjectFile(profile, file.uploaded_by)
              return (
                <div
                  key={file.id}
                  className={cn(
                    'rounded-xl border bg-[var(--color-surface)] p-4',
                    'transition-shadow hover:shadow-md',
                  )}
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <div className="text-[28px] mb-2">
                    {getFileIcon(file.mime_type)}
                  </div>
                  <button
                    type="button"
                    onClick={() => setPreviewFile(file)}
                    className="text-[13px] font-medium truncate mb-1 block w-full text-left hover:text-[var(--color-accent)] transition-colors"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {file.file_name}
                  </button>
                  <p
                    className="text-[11px] mb-2"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {formatBytes(file.file_size)} ·{' '}
                    {file.uploader?.full_name ?? 'Uploader'} ·{' '}
                    {formatDistanceToNow(new Date(file.created_at), {
                      addSuffix: true,
                    })}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
                      style={
                        file.is_client_visible
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
                      {file.is_client_visible ? 'Client can see' : 'Internal'}
                    </span>
                    <div className="flex items-center gap-1">
                      {canToggle && (
                        <button
                          type="button"
                          aria-label="Toggle visibility"
                          disabled={togglingId === file.id}
                          className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-40"
                          onClick={() => void handleToggle(file)}
                        >
                          {togglingId === file.id ? (
                            <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin block" />
                          ) : file.is_client_visible ? (
                            <EyeOff size={13} />
                          ) : (
                            <Eye size={13} />
                          )}
                        </button>
                      )}
                      <a
                        href={file.file_url}
                        download={file.file_name}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors"
                        aria-label="Download"
                      >
                        <Download size={13} />
                      </a>
                      {canDelete && (
                        <button
                          type="button"
                          aria-label="Delete file"
                          className="flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-colors"
                          onClick={() => setDeleteId(file.id)}
                        >
                          <Trash2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div
            className="py-16 text-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <p className="text-[14px]">No files in this category</p>
          </div>
        )}
      </div>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}

      <Modal
        open={!!deleteId}
        onClose={() => setDeleteId(null)}
        title="Delete file?"
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
              loading={deleteFile.isPending}
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
          Remove this file from the project?
        </p>
      </Modal>
    </>
  )
}
