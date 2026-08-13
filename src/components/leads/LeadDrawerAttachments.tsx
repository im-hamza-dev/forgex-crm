'use client'

import { useRef, useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Trash2, X, Download } from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  useCreateLeadAttachment,
  useDeleteLeadAttachment,
  useLeadAttachments,
} from '@/hooks/useLeads'
import { canDeleteAttachment } from '@/lib/leads-permissions'
import type { Lead, LeadAttachment } from '@/types/leads'

interface LeadDrawerAttachmentsProps {
  lead: Lead
}

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

interface FilePreviewModalProps {
  file: LeadAttachment
  onClose: () => void
}

function FilePreviewModal({ file, onClose }: FilePreviewModalProps) {
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
                to view its contents.
              </p>
              <a
                href={file.file_url}
                download={file.file_name}
                target="_blank"
                rel="noreferrer"
                className={cn(
                  'flex items-center gap-2 h-[40px] px-5 rounded-lg',
                  'text-[13px] font-semibold text-white',
                  'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
                  'transition-colors',
                )}
              >
                <Download size={15} />
                Download file
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function LeadDrawerAttachments({ lead }: LeadDrawerAttachmentsProps) {
  const { profile } = useAuth()
  const inputRef = useRef<HTMLInputElement>(null)
  const { data: attachments = [], isLoading } = useLeadAttachments(lead.id)
  const createAttachment = useCreateLeadAttachment()
  const deleteAttachment = useDeleteLeadAttachment()
  const [previewFile, setPreviewFile] = useState<LeadAttachment | null>(null)

  const handleUpload = async (file: File) => {
    try {
      const supabase = createClient()
      const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const path = `${lead.id}/${safeName}`

      const { error: uploadError } = await supabase.storage
        .from('lead-attachments')
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream',
        })

      if (uploadError) {
        console.error('[upload error]', uploadError)
        toast.error(`Upload failed: ${uploadError.message}`)
        return
      }

      const { data: urlData } = supabase.storage
        .from('lead-attachments')
        .getPublicUrl(path)

      await createAttachment.mutateAsync({
        leadId: lead.id,
        file_name: file.name,
        file_url: urlData.publicUrl,
        file_size: file.size,
        mime_type: file.type || null,
      })
      toast.success('File uploaded')
    } catch (err) {
      console.error('[upload catch]', err)
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  return (
    <>
      <div className="p-5 flex flex-col gap-4">
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

        <button
          type="button"
          className={cn(
            'flex items-center justify-center gap-2',
            'h-[80px] rounded-xl border-2 border-dashed',
            'border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)]',
            'cursor-pointer transition-colors w-full',
            'hover:border-[var(--color-accent)]',
            'disabled:opacity-60 disabled:cursor-not-allowed',
          )}
          onClick={() => inputRef.current?.click()}
          disabled={createAttachment.isPending}
        >
          {createAttachment.isPending && (
            <span className="w-4 h-4 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          )}
          <p className="text-[13px] text-[var(--color-text-muted)]">
            {createAttachment.isPending
              ? 'Uploading…'
              : 'Drop files here or click to upload'}
          </p>
        </button>

        {isLoading && (
          <div className="flex flex-col gap-2">
            {[1, 2].map((i) => (
              <div
                key={i}
                className="h-[52px] rounded-lg animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
              />
            ))}
          </div>
        )}

        {!isLoading && attachments.length === 0 && (
          <p className="text-center text-[13px] text-[var(--color-text-muted)]">
            No attachments yet
          </p>
        )}

        <ul className="flex flex-col gap-2">
          {attachments.map((file) => (
            <li
              key={file.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-3 py-2.5 hover:bg-[var(--color-surface-hover)] transition-colors group"
            >
              <span className="text-[18px] shrink-0">
                {getFileIcon(file.mime_type)}
              </span>
              <div className="flex-1 min-w-0">
                <button
                  type="button"
                  onClick={() => setPreviewFile(file)}
                  className="text-[13px] font-medium text-[var(--color-text-heading)] truncate block hover:text-[var(--color-accent)] transition-colors text-left w-full"
                >
                  {file.file_name}
                </button>
                <p className="text-[11px] text-[var(--color-text-muted)]">
                  {formatBytes(file.file_size)} ·{' '}
                  {file.uploader?.full_name ?? 'Uploader'} ·{' '}
                  {formatDistanceToNow(new Date(file.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={file.file_url}
                  download={file.file_name}
                  target="_blank"
                  rel="noreferrer"
                  className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] hover:text-[var(--color-text-body)] transition-all"
                  aria-label="Download"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Download size={13} />
                </a>
                {canDeleteAttachment(profile, file.uploaded_by) && (
                  <button
                    type="button"
                    aria-label="Delete attachment"
                    disabled={deleteAttachment.isPending}
                    className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-7 h-7 rounded-lg text-[var(--color-text-muted)] hover:text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)] transition-all disabled:opacity-40"
                    onClick={() => {
                      void deleteAttachment
                        .mutateAsync({
                          leadId: lead.id,
                          attachmentId: file.id,
                        })
                        .then(() => toast.success('Attachment deleted'))
                        .catch((err: unknown) =>
                          toast.error(
                            err instanceof Error
                              ? err.message
                              : 'Failed to delete',
                          ),
                        )
                    }}
                  >
                    {deleteAttachment.isPending ? (
                      <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin block" />
                    ) : (
                      <Trash2 size={13} />
                    )}
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {previewFile && (
        <FilePreviewModal
          file={previewFile}
          onClose={() => setPreviewFile(null)}
        />
      )}
    </>
  )
}
