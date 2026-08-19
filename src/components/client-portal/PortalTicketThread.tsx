'use client'

import { useState, useRef, type ChangeEvent } from 'react'
import { ChevronLeft, Send, Check, Paperclip, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { FileViewer, type ViewerFile } from '@/components/ui'
import type { PortalTicket } from './PortalSupportPage'

interface Message {
  id: string
  sender: 'team' | 'client'
  content: string
  time: string
  date?: string
  attachments?: { name: string; url: string; size: number; mimeType: string }[]
}

interface PortalTicketThreadProps {
  ticket: PortalTicket
  messages: Message[]
  onBack: () => void
  onSend: (
    content: string,
    attachments: { name: string; url: string; size: number; mimeType: string }[],
  ) => void
  onReopen?: () => Promise<void>
}

const STATUS_CONFIG = {
  open: { label: 'Open', bg: '#FEF7E6', text: '#8B5E00' },
  in_progress: { label: 'In Progress', bg: '#EEF3FA', text: '#1A3D6B' },
  resolved: { label: 'Resolved', bg: '#EDF5ED', text: '#2D6A2D' },
  closed: { label: 'Closed', bg: '#F5F5F5', text: '#6B6B6B' },
}

export function PortalTicketThread({
  ticket,
  messages,
  onBack,
  onSend,
  onReopen,
}: PortalTicketThreadProps) {
  const [reply, setReply] = useState('')
  const [reopening, setReopening] = useState(false)
  const [replyAttachments, setReplyAttachments] = useState<{
    name: string
    url: string
    size: number
    mimeType: string
    uploading?: boolean
    localFile?: File
  }[]>([])
  const [viewingFile, setViewingFile] = useState<ViewerFile | null>(null)
  const replyFileRef = useRef<HTMLInputElement>(null)
  const statusConf = STATUS_CONFIG[ticket.status]
  const isResolved = ticket.status === 'resolved' || ticket.status === 'closed'

  const handleReplyFileSelect = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    const supabase = createClient()

    for (const file of files) {
      setReplyAttachments((prev) => [
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
        .upload(path, file)

      if (!error) {
        const {
          data: { publicUrl },
        } = supabase.storage.from('ticket-attachments').getPublicUrl(path)
        setReplyAttachments((prev) =>
          prev.map((a) =>
            a.localFile === file
              ? {
                  name: file.name,
                  url: publicUrl,
                  size: file.size,
                  mimeType: file.type,
                }
              : a,
          ),
        )
      } else {
        setReplyAttachments((prev) => prev.filter((a) => a.localFile !== file))
      }
    }
    if (replyFileRef.current) replyFileRef.current.value = ''
  }

  const handleSend = () => {
    if (!reply.trim() && !replyAttachments.length) return
    if (replyAttachments.some((a) => a.uploading)) return
    onSend(
      reply.trim(),
      replyAttachments.map((a) => ({
        name: a.name,
        url: a.url,
        size: a.size,
        mimeType: a.mimeType,
      })),
    )
    setReply('')
    setReplyAttachments([])
  }

  const renderAttachments = (msg: Message) =>
    msg.attachments && msg.attachments.length > 0 ? (
      <div
        className="flex flex-col gap-1.5 mt-2 pt-2"
        style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }}
      >
        {msg.attachments.map((att, i) => (
          <button
            key={`${msg.id}-${i}`}
            type="button"
            onClick={() =>
              setViewingFile({
                id: `${msg.id}-${i}`,
                name: att.name,
                url: att.url,
                mimeType: att.mimeType,
                size: `${Math.round(att.size / 1024)} KB`,
              })
            }
            className="flex items-center gap-2 hover:opacity-70 transition-opacity text-left"
          >
            <Paperclip
              size={12}
              className="shrink-0"
              style={{ color: 'var(--color-accent)' }}
            />
            <span
              className="text-[12px] underline truncate"
              style={{ color: 'var(--color-accent)' }}
            >
              {att.name}
            </span>
            <span
              className="text-[10px] shrink-0"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {Math.round(att.size / 1024)} KB
            </span>
          </button>
        ))}
      </div>
    ) : null

  return (
    <div className="max-w-[760px] mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] font-medium mb-5 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-accent)' }}
      >
        <ChevronLeft size={15} />
        All Requests
      </button>

      <div
        className="rounded-xl border px-4 sm:px-5 py-4 mb-4"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <h2
          className="text-[18px] font-bold mb-2"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {ticket.subject}
        </h2>
        <div className="flex items-center gap-3">
          <span
            className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
            style={{ background: statusConf.bg, color: statusConf.text }}
          >
            {statusConf.label}
          </span>
          <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
            Raised {ticket.raisedDate}
          </span>
        </div>
      </div>

      <div
        className="rounded-xl border p-4 sm:p-5 mb-4"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <div className="flex flex-col gap-5">
          {messages.map((msg) => (
            <div key={msg.id}>
              {msg.date && (
                <div className="flex items-center gap-3 my-3">
                  <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                  <span className="text-[11px] px-3" style={{ color: 'var(--color-text-muted)' }}>
                    {msg.date}
                  </span>
                  <div className="flex-1 h-px" style={{ background: 'var(--color-border)' }} />
                </div>
              )}

              {msg.sender === 'team' ? (
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                      style={{ background: 'var(--color-accent)' }}
                    >
                      F
                    </div>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: 'var(--color-text-heading)' }}
                    >
                      Forgex Team
                    </span>
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {msg.time}
                    </span>
                  </div>
                  <div
                    className="ml-0 sm:ml-10 rounded-tl-none rounded-xl px-4 py-3 max-w-full sm:max-w-[85%]"
                    style={{ background: 'var(--color-surface-hover)' }}
                  >
                    <p
                      className="text-[14px] leading-relaxed"
                      style={{ color: 'var(--color-text-body)' }}
                    >
                      {msg.content}
                    </p>
                    {renderAttachments(msg)}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-end">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                      {msg.time}
                    </span>
                    <span
                      className="text-[13px] font-semibold"
                      style={{ color: 'var(--color-text-heading)' }}
                    >
                      You
                    </span>
                  </div>
                  <div
                    className="rounded-tr-none rounded-xl px-4 py-3 max-w-[85%]"
                    style={{ background: '#F5EDE6' }}
                  >
                    <p
                      className="text-[14px] leading-relaxed"
                      style={{ color: 'var(--color-text-body)' }}
                    >
                      {msg.content}
                    </p>
                    {renderAttachments(msg)}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {isResolved ? (
        <div
          className="rounded-xl flex flex-col sm:flex-row items-center justify-center gap-2 py-4 px-4 sm:px-5 text-[14px] font-medium text-center"
          style={{ background: '#EDF5ED', color: '#2D6A2D' }}
        >
          <Check size={15} />
          This request has been resolved
          <span className="hidden sm:inline"> · </span>
          <button
            type="button"
            disabled={reopening}
            onClick={() => {
              void (async () => {
                if (!onReopen) return
                setReopening(true)
                try {
                  await onReopen()
                } finally {
                  setReopening(false)
                }
              })()
            }}
            className="underline text-[13px] disabled:opacity-50 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            {reopening ? 'Reopening...' : 'Reopen request'}
          </button>
        </div>
      ) : (
        <div
          className="rounded-xl border p-4"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-[0.06em] mb-2"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Reply
          </p>
          <textarea
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            placeholder="Write your reply..."
            rows={3}
            className="w-full px-3.5 py-3 rounded-lg text-[14px] border outline-none resize-y transition-colors focus:border-[var(--color-accent)] mb-3"
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-body)',
              borderColor: 'var(--color-border)',
              minHeight: '90px',
            }}
          />
          {replyAttachments.length > 0 && (
            <div className="flex flex-col gap-1.5 mb-2">
              {replyAttachments.map((file, i) => (
                <div
                  key={`${file.name}-${i}`}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                  style={{ background: 'var(--color-surface-hover)' }}
                >
                  <Paperclip size={12} style={{ color: 'var(--color-accent)' }} />
                  <span
                    className="text-[12px] flex-1 truncate"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    {file.name}
                  </span>
                  {file.uploading ? (
                    <span className="w-3 h-3 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        setReplyAttachments((p) => p.filter((_, j) => j !== i))
                      }
                    >
                      <X size={12} style={{ color: 'var(--color-text-muted)' }} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="flex items-center justify-between mt-2">
            <button
              type="button"
              onClick={() => replyFileRef.current?.click()}
              className="flex items-center gap-1.5 text-[12px] font-medium hover:opacity-70"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Paperclip size={13} /> Attach file
            </button>
            <input
              ref={replyFileRef}
              type="file"
              multiple
              className="hidden"
              onChange={(e) => void handleReplyFileSelect(e)}
            />
            <button
              type="button"
              onClick={handleSend}
              disabled={
                (!reply.trim() && !replyAttachments.length) ||
                replyAttachments.some((a) => a.uploading)
              }
              className="flex items-center gap-2 h-[40px] px-5 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40"
              style={{ background: 'var(--color-accent)' }}
            >
              <Send size={14} /> Send Reply
            </button>
          </div>
        </div>
      )}
      <FileViewer file={viewingFile} onClose={() => setViewingFile(null)} />
    </div>
  )
}
