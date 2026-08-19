'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import { X, Paperclip, UploadCloud } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Priority = 'low' | 'medium' | 'high'

interface AttachmentFile {
  name: string
  url: string
  size: number
  mimeType: string
  localFile?: File
  uploading?: boolean
}

interface PortalNewTicketPanelProps {
  open: boolean
  onClose: () => void
  onSubmit?: (data: {
    subject: string
    priority: Priority
    description: string
    attachments: { name: string; url: string; size: number; mimeType: string }[]
  }) => void
}

const PRIORITY_OPTIONS: {
  value: Priority
  label: string
  selected: { bg: string; border: string; text: string }
}[] = [
  {
    value: 'low',
    label: 'Low',
    selected: { bg: '#EEF3FA', border: '#1A3D6B', text: '#1A3D6B' },
  },
  {
    value: 'medium',
    label: 'Medium',
    selected: { bg: '#FEF7E6', border: '#8B5E00', text: '#8B5E00' },
  },
  {
    value: 'high',
    label: 'High',
    selected: { bg: '#FDF0F0', border: '#8B1A1A', text: '#8B1A1A' },
  },
]

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function PortalNewTicketPanel({
  open,
  onClose,
  onSubmit,
}: PortalNewTicketPanelProps) {
  const [subject, setSubject] = useState('')
  const [priority, setPriority] = useState<Priority>('medium')
  const [description, setDescription] = useState('')
  const [attachments, setAttachments] = useState<AttachmentFile[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return

    const supabase = createClient()

    for (const file of files) {
      setAttachments((prev) => [
        ...prev,
        {
          name: file.name,
          url: '',
          size: file.size,
          mimeType: file.type,
          localFile: file,
          uploading: true,
        },
      ])

      const path = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const { error } = await supabase.storage
        .from('ticket-attachments')
        .upload(path, file, { upsert: false })

      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('ticket-attachments').getPublicUrl(path)

        setAttachments((prev) =>
          prev.map((a) =>
            a.localFile === file
              ? {
                  name: file.name,
                  url: publicUrl,
                  size: file.size,
                  mimeType: file.type,
                  uploading: false,
                }
              : a,
          ),
        )
      } else {
        setAttachments((prev) => prev.filter((a) => a.localFile !== file))
      }
    }

    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index))
  }

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) return
    if (attachments.some((a) => a.uploading)) return

    setIsSubmitting(true)
    try {
      onSubmit?.({
        subject,
        priority,
        description,
        attachments: attachments.map((a) => ({
          name: a.name,
          url: a.url,
          size: a.size,
          mimeType: a.mimeType,
        })),
      })
      setSubject('')
      setPriority('medium')
      setDescription('')
      setAttachments([])
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!open) return null

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        style={{ background: 'rgba(26,16,8,0.4)' }}
        onClick={onClose}
      />
      <div
        className="fixed inset-x-0 top-0 bottom-0 sm:inset-x-auto sm:right-0 sm:w-[480px] sm:max-w-[100vw] z-50 flex flex-col"
        style={{
          background: 'var(--color-surface)',
          boxShadow: '-4px 0 32px rgba(26,16,8,0.12)',
        }}
      >
        <div
          className="flex items-center justify-between h-14 sm:h-[64px] px-4 sm:px-6 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <h2
            className="text-[18px] font-bold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Raise a Request
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-5 sm:py-6 flex flex-col gap-5">
          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Brief description of your request"
              className="w-full h-[44px] px-3.5 rounded-lg text-[14px] border outline-none focus:border-[var(--color-accent)]"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-body)',
                borderColor: 'var(--color-border)',
              }}
            />
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Priority
            </label>
            <div className="flex gap-2">
              {PRIORITY_OPTIONS.map((opt) => {
                const isSelected = priority === opt.value
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className="flex-1 h-[40px] rounded-lg text-[13px] font-semibold border transition-colors"
                    style={{
                      background: isSelected
                        ? opt.selected.bg
                        : 'var(--color-surface)',
                      borderColor: isSelected
                        ? opt.selected.border
                        : 'var(--color-border)',
                      color: isSelected
                        ? opt.selected.text
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {opt.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div>
            <label
              className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your request in detail..."
              rows={5}
              className="w-full px-3.5 py-3 rounded-lg text-[14px] border outline-none resize-y focus:border-[var(--color-accent)]"
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-body)',
                borderColor: 'var(--color-border)',
                minHeight: '120px',
              }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label
                className="text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Attachments{' '}
                <span className="normal-case tracking-normal font-normal">
                  (optional)
                </span>
              </label>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 text-[11px] font-medium hover:opacity-70 transition-opacity"
                style={{ color: 'var(--color-accent)' }}
              >
                <Paperclip size={11} /> Add files
              </button>
            </div>

            {attachments.length > 0 && (
              <div className="flex flex-col gap-2 mb-3">
                {attachments.map((file, i) => (
                  <div
                    key={`${file.name}-${i}`}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg border"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-surface-hover)',
                    }}
                  >
                    <Paperclip
                      size={13}
                      className="shrink-0"
                      style={{ color: 'var(--color-accent)' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-[12px] font-medium truncate"
                        style={{ color: 'var(--color-text-body)' }}
                      >
                        {file.name}
                      </p>
                      <p
                        className="text-[10px]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        {formatSize(file.size)}
                      </p>
                    </div>
                    {file.uploading ? (
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin shrink-0" />
                    ) : (
                      <button
                        type="button"
                        onClick={() => removeAttachment(i)}
                        className="hover:opacity-70 shrink-0"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        <X size={13} />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex flex-col items-center justify-center gap-1.5 rounded-lg border-2 border-dashed transition-colors hover:border-[var(--color-accent)]"
              style={{
                borderColor: '#E8D5C4',
                background: '#F5EDE6',
                height: '72px',
              }}
            >
              <UploadCloud
                size={16}
                style={{ color: 'var(--color-text-muted)' }}
              />
              <span
                className="text-[12px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Click to attach files
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => void handleFileSelect(e)}
            />
          </div>
        </div>

        <div
          className="shrink-0 px-4 sm:px-6 py-3 sm:py-4 flex flex-col gap-2"
          style={{ borderTop: '1px solid var(--color-border)' }}
        >
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 h-[42px] rounded-lg text-[14px] font-medium border hover:bg-[var(--color-surface-hover)]"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-secondary)',
              }}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              disabled={
                !subject.trim() ||
                !description.trim() ||
                isSubmitting ||
                attachments.some((a) => a.uploading)
              }
              className="flex-1 h-[42px] rounded-lg text-[14px] font-semibold text-white disabled:opacity-40 flex items-center justify-center gap-2"
              style={{ background: 'var(--color-accent)' }}
            >
              {isSubmitting && (
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              Submit Request
            </button>
          </div>
          <p
            className="text-[11px] text-center"
            style={{ color: 'var(--color-text-muted)' }}
          >
            We typically respond within 1 business day
          </p>
        </div>
      </div>
    </>
  )
}
