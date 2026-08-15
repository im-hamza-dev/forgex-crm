'use client'

import { useRef, useState, type ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import {
  ChevronLeft,
  Send,
  FileDown,
  Trash2,
  Eye,
  Upload,
  FileText,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Button, toast } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  useCreateClientDocument,
  useUpdateClientDocument,
  useDeleteClientDocument,
  useSendDocumentToClient,
  useClientAccountsForDocs,
} from '@/hooks/useDocs'
import { canManageClientDocs } from '@/lib/docs-permissions'
import {
  RichDocEditor,
  type RichDocEditorHandle,
  markdownToDoc,
  docToMarkdown,
} from './RichDocEditor'
import { ROUTES } from '@/constants/routes'
import type { ClientDocument, DocumentType, ContentType } from '@/types/docs'

const DOCUMENT_TYPES: { value: DocumentType; label: string }[] = [
  { value: 'welcome', label: 'Welcome Letter' },
  { value: 'nda', label: 'NDA' },
  { value: 'thankyou', label: 'Thank You' },
  { value: 'recommendation', label: 'Recommendation' },
  { value: 'proposal', label: 'Proposal' },
  { value: 'contract', label: 'Contract' },
  { value: 'other', label: 'Other' },
]

async function exportEditorPdf(filename: string) {
  if (document.querySelector('iframe[title="PDF Preview"]')) {
    toast.error(
      'Use the PDF directly — Export PDF is for written documents only',
    )
    return
  }
  const html2pdf = (await import('html2pdf.js')).default
  const element = document.querySelector('.docs-editor')
  if (!(element instanceof HTMLElement)) return
  await html2pdf()
    .set({
      margin: [15, 15],
      filename,
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
    })
    .from(element)
    .save()
}

interface ClientDocEditorProps {
  doc?: ClientDocument | null
}

export function ClientDocEditor({ doc }: ClientDocEditorProps) {
  const router = useRouter()
  const { profile } = useAuth()
  const canManage = canManageClientDocs(profile)
  const createDoc = useCreateClientDocument()
  const updateDoc = useUpdateClientDocument()
  const deleteDoc = useDeleteClientDocument()
  const sendDoc = useSendDocumentToClient()
  const { data: clientAccounts = [] } = useClientAccountsForDocs()

  const editorRef = useRef<RichDocEditorHandle>(null)
  const [title, setTitle] = useState(doc?.title ?? '')
  const [documentType, setDocumentType] = useState<DocumentType>(
    doc?.document_type ?? 'other',
  )
  const [contentType, setContentType] = useState<ContentType>(
    doc?.content_type ?? 'editor',
  )
  const [body, setBody] = useState<Record<string, unknown> | null>(() => {
    if (!doc?.body) return null
    if (doc.body.type === 'markdown') return doc.body
    const md = docToMarkdown(doc.body)
    if (md === '__LEGACY_TIPTAP__') return null
    return markdownToDoc(md)
  })
  const [fileUrl, setFileUrl] = useState<string | null>(doc?.file_url ?? null)
  const [fileName, setFileName] = useState<string | null>(
    doc?.file_name ?? null,
  )
  const [fileUploading, setFileUploading] = useState(false)
  const [currentDocId, setCurrentDocId] = useState<string | null>(
    doc?.id ?? null,
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [sendModalOpen, setSendModalOpen] = useState(false)
  const [selectedClients, setSelectedClients] = useState<string[]>([])
  const [isSending, setIsSending] = useState(false)

  const isSaving = createDoc.isPending || updateDoc.isPending
  const alreadySentIds = new Set(
    (doc?.sends ?? []).map((s) => s.client_account_id),
  )

  const save = async () => {
    if (!canManage) return
    if (!title.trim()) {
      toast.error('Please enter a document title')
      return
    }
    try {
      const data = {
        title,
        document_type: documentType,
        ...(currentDocId ? {} : { content_type: contentType }),
        body: contentType === 'editor' ? (body ?? null) : null,
        file_url: contentType === 'pdf' ? fileUrl : null,
        file_name: contentType === 'pdf' ? fileName : null,
      }
      if (currentDocId) {
        await updateDoc.mutateAsync({ id: currentDocId, data })
      } else {
        const created = await createDoc.mutateAsync(data)
        setCurrentDocId(created.id)
        router.replace(ROUTES.DOC_CLIENT(created.id))
      }
      toast.success('Saved')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const handleDelete = async () => {
    if (!currentDocId) return
    try {
      await deleteDoc.mutateAsync(currentDocId)
      toast.success('Document deleted')
      router.push(ROUTES.DOCS)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.type !== 'application/pdf') {
      toast.error('Only PDF files are allowed')
      return
    }
    setFileUploading(true)
    try {
      const supabase = createClient()
      const path = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const { error } = await supabase.storage
        .from('client-documents')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const {
        data: { publicUrl },
      } = supabase.storage.from('client-documents').getPublicUrl(path)
      setFileUrl(publicUrl)
      setFileName(file.name)
      toast.success('PDF uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setFileUploading(false)
    }
  }

  const handleSend = async () => {
    if (!currentDocId || selectedClients.length === 0) return
    setIsSending(true)
    try {
      await sendDoc.mutateAsync({
        documentId: currentDocId,
        clientAccountIds: selectedClients,
      })
      toast.success(
        `Sent to ${selectedClients.length} client${selectedClients.length > 1 ? 's' : ''}`,
      )
      setSendModalOpen(false)
      setSelectedClients([])
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Send failed')
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'var(--color-page)' }}
    >
      <div
        className="flex items-center justify-between h-[52px] px-5 border-b shrink-0 sticky top-0 z-20"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
        }}
      >
        <button
          type="button"
          onClick={() => router.push(ROUTES.DOCS)}
          className="flex items-center gap-1 text-[13px] hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ChevronLeft size={15} />
          Docs
        </button>

        <div className="flex items-center gap-2">
          {!canManage && (
            <span
              className="inline-flex items-center gap-1 text-[12px] px-3 py-1 rounded-lg border"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              <Eye size={12} />
              View only
            </span>
          )}
          {canManage && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void save()}
              loading={isSaving}
            >
              Save
            </Button>
          )}
          <button
            type="button"
            onClick={() =>
              void exportEditorPdf(`${title || 'document'}.pdf`).catch(() =>
                toast.error('PDF export failed'),
              )
            }
            className="flex items-center gap-1.5 h-[32px] px-3 rounded-lg text-[12px] font-medium border hover:bg-[var(--color-surface-hover)] transition-colors"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-body)',
            }}
          >
            <FileDown size={13} />
            Export PDF
          </button>
          {canManage && currentDocId && (
            <button
              type="button"
              onClick={() => setSendModalOpen(true)}
              className="flex items-center gap-1.5 h-[32px] px-3 rounded-lg text-[12px] font-semibold text-white transition-colors"
              style={{ background: 'var(--color-accent)' }}
            >
              <Send size={13} />
              Send to Client
            </button>
          )}
          {canManage && currentDocId && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 h-[32px] px-3 rounded-lg text-[12px] font-medium hover:bg-[var(--color-danger-bg)] transition-colors"
              style={{ color: 'var(--color-danger)' }}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="max-w-[800px] mx-auto px-8 py-8">
            {canManage ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Document title..."
                className="w-full text-[32px] font-bold bg-transparent outline-none mb-6 placeholder:text-[var(--color-text-muted)]"
                style={{ color: 'var(--color-text-heading)' }}
              />
            ) : (
              <h1
                className="text-[32px] font-bold mb-6"
                style={{ color: 'var(--color-text-heading)' }}
              >
                {title || 'Untitled'}
              </h1>
            )}
            {canManage && (
              <div className="flex items-center gap-2 mb-6">
                <button
                  type="button"
                  onClick={() => setContentType('editor')}
                  className={cn(
                    'flex items-center gap-1.5 h-[30px] px-3 rounded-lg text-[12px] font-medium border transition-colors',
                    contentType === 'editor'
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  <FileText size={12} />
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setContentType('pdf')}
                  className={cn(
                    'flex items-center gap-1.5 h-[30px] px-3 rounded-lg text-[12px] font-medium border transition-colors',
                    contentType === 'pdf'
                      ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)]',
                  )}
                >
                  <Upload size={12} />
                  Upload PDF
                </button>
              </div>
            )}

            {contentType === 'editor' ? (
              <RichDocEditor
                ref={editorRef}
                content={body}
                onChange={setBody}
                editable={canManage}
                placeholder="Start writing your client document..."
              />
            ) : (
              <div className="flex flex-col gap-4">
                {canManage && (
                  <label
                    className={cn(
                      'flex flex-col items-center justify-center gap-3 h-[200px] rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]',
                      fileUploading && 'opacity-60 pointer-events-none',
                    )}
                    style={{ borderColor: 'var(--color-border)' }}
                  >
                    <input
                      type="file"
                      accept="application/pdf"
                      className="hidden"
                      onChange={(e) => void handleFileUpload(e)}
                    />
                    {fileUploading ? (
                      <span className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
                    ) : (
                      <>
                        <Upload
                          size={24}
                          style={{ color: 'var(--color-text-muted)' }}
                        />
                        <div className="text-center">
                          <p
                            className="text-[13px] font-medium"
                            style={{ color: 'var(--color-text-body)' }}
                          >
                            {fileUrl ? 'Replace PDF' : 'Upload PDF'}
                          </p>
                          <p
                            className="text-[11px]"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            Click to browse
                          </p>
                        </div>
                      </>
                    )}
                  </label>
                )}
                {fileUrl && (
                  <div className="flex flex-col gap-2">
                    <div
                      className="flex items-center justify-between px-3 py-2 rounded-lg border"
                      style={{
                        borderColor: 'var(--color-border)',
                        background: 'var(--color-surface-hover)',
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <FileText
                          size={14}
                          style={{ color: 'var(--color-accent)' }}
                        />
                        <span
                          className="text-[13px]"
                          style={{ color: 'var(--color-text-body)' }}
                        >
                          {fileName ?? 'document.pdf'}
                        </span>
                      </div>
                      {canManage && (
                        <button
                          type="button"
                          onClick={() => {
                            setFileUrl(null)
                            setFileName(null)
                          }}
                          className="hover:opacity-70 transition-opacity"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                    <iframe
                      src={fileUrl}
                      className="w-full rounded-xl border"
                      style={{
                        height: '600px',
                        borderColor: 'var(--color-border)',
                      }}
                      title="PDF Preview"
                    />
                  </div>
                )}
                {!fileUrl && !canManage && (
                  <p
                    className="text-[13px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    No PDF uploaded yet.
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div
          className="w-[280px] shrink-0 border-l overflow-auto"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <div className="p-4 flex flex-col gap-4">
            <div>
              <label
                className="block text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Document Type
              </label>
              <select
                value={documentType}
                disabled={!canManage}
                onChange={(e) =>
                  setDocumentType(e.target.value as DocumentType)
                }
                className="w-full h-[34px] px-2 rounded-lg text-[12px] border outline-none focus:border-[var(--color-accent)] disabled:opacity-60"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-page)',
                  color: 'var(--color-text-body)',
                }}
              >
                {DOCUMENT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {doc?.sends && doc.sends.length > 0 && (
              <div>
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.06em] mb-2"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Sent To ({doc.sends.length})
                </p>
                <div className="flex flex-col gap-1.5">
                  {doc.sends.map((send) => (
                    <div key={send.id} className="flex items-center gap-2">
                      <Avatar
                        name={send.client_account?.full_name ?? 'Client'}
                        size="xs"
                      />
                      <div className="min-w-0">
                        <p
                          className="text-[12px] font-medium truncate"
                          style={{ color: 'var(--color-text-body)' }}
                        >
                          {send.client_account?.full_name}
                        </p>
                        <p
                          className="text-[10px] truncate"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {send.client_account?.company ??
                            send.client_account?.email}
                        </p>
                      </div>
                      {send.viewed_at && (
                        <span
                          className="text-[9px] shrink-0 px-1.5 py-0.5 rounded-full"
                          style={{
                            background: 'var(--color-success-bg)',
                            color: 'var(--color-success)',
                          }}
                        >
                          Viewed
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {sendModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setSendModalOpen(false)}
          />
          <div className="relative z-10 bg-[var(--color-surface)] rounded-2xl shadow-xl p-6 w-[420px] flex flex-col gap-4 max-h-[80vh] overflow-auto">
            <div>
              <h3
                className="text-[16px] font-bold mb-1"
                style={{ color: 'var(--color-text-heading)' }}
              >
                Send to Client
              </h3>
              <p
                className="text-[13px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Select which clients should receive this document.
              </p>
            </div>

            {clientAccounts.length === 0 ? (
              <p
                className="text-[13px] text-center py-4"
                style={{ color: 'var(--color-text-muted)' }}
              >
                No active clients found.
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {clientAccounts.map((client) => {
                  const alreadySent = alreadySentIds.has(client.id)
                  const selected = selectedClients.includes(client.id)
                  return (
                    <label
                      key={client.id}
                      className={cn(
                        'flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-colors',
                        selected
                          ? 'border-[var(--color-accent)] bg-[var(--color-accent-subtle)]'
                          : 'border-[var(--color-border)] hover:bg-[var(--color-surface-hover)]',
                        alreadySent && 'opacity-60',
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={selected}
                        disabled={alreadySent}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedClients((prev) => [...prev, client.id])
                          } else {
                            setSelectedClients((prev) =>
                              prev.filter((id) => id !== client.id),
                            )
                          }
                        }}
                        className="w-4 h-4 accent-[var(--color-accent)]"
                      />
                      <Avatar name={client.full_name} size="sm" />
                      <div className="min-w-0 flex-1">
                        <p
                          className="text-[13px] font-medium"
                          style={{ color: 'var(--color-text-heading)' }}
                        >
                          {client.full_name}
                        </p>
                        <p
                          className="text-[11px] truncate"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          {client.company ?? client.email}
                        </p>
                      </div>
                      {alreadySent && (
                        <span
                          className="text-[10px] px-2 py-0.5 rounded-full shrink-0"
                          style={{
                            background: 'var(--color-success-bg)',
                            color: 'var(--color-success)',
                          }}
                        >
                          Sent
                        </span>
                      )}
                    </label>
                  )
                })}
              </div>
            )}

            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setSendModalOpen(false)}
                className="h-[38px] px-4 rounded-lg text-[13px] font-medium border hover:bg-[var(--color-surface-hover)] transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-body)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={selectedClients.length === 0 || isSending}
                onClick={() => void handleSend()}
                className="h-[38px] px-4 rounded-lg text-[13px] font-semibold text-white disabled:opacity-40 flex items-center gap-2"
                style={{ background: 'var(--color-accent)' }}
              >
                {isSending && (
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                Send to {selectedClients.length} client
                {selectedClients.length !== 1 ? 's' : ''}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmDelete(false)}
          />
          <div className="relative z-10 bg-[var(--color-surface)] rounded-2xl shadow-xl p-6 w-[340px] flex flex-col gap-4">
            <h3
              className="text-[16px] font-bold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Delete document?
            </h3>
            <p
              className="text-[13px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              This will permanently delete{' '}
              <span className="font-semibold">{title || 'this document'}</span>{' '}
              and remove it from all clients it was sent to.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="h-[38px] px-4 rounded-lg text-[13px] font-medium border hover:bg-[var(--color-surface-hover)] transition-colors"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-body)',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={deleteDoc.isPending}
                className="h-[38px] px-4 rounded-lg text-[13px] font-semibold text-white bg-[var(--color-danger)] hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              >
                {deleteDoc.isPending && (
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
