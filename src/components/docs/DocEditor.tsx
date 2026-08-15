'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import {
  ChevronLeft,
  Clock,
  FileDown,
  Trash2,
  Eye,
  Pencil,
  Wand2,
  ChevronDown,
  ChevronUp,
  Check,
  Copy,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, Button, toast } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  useCreateInternalDoc,
  useUpdateInternalDoc,
  useDeleteInternalDoc,
} from '@/hooks/useDocs'
import { canEditDoc, canDeleteDoc } from '@/lib/docs-permissions'
import {
  RichDocEditor,
  type RichDocEditorHandle,
  docToMarkdown,
  markdownToDoc,
} from './RichDocEditor'
import { ROUTES } from '@/constants/routes'
import type { InternalDoc, DocCategory, DocStatus } from '@/types/docs'

const CATEGORIES: DocCategory[] = [
  'SOPs',
  'Playbooks',
  'Templates',
  'Research',
  'Meeting Notes',
  'Processes',
  'Other',
]

const STATUS_OPTIONS: { value: DocStatus; label: string }[] = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
]

function formatSavedAgo(at: Date | null | undefined): string {
  if (!at) return 'Not saved'
  const s = Math.max(0, Math.floor((Date.now() - at.getTime()) / 1000))
  if (s < 5) return 'Saved just now'
  if (s < 60) return `Saved ${s}s ago`
  const m = Math.floor(s / 60)
  return m < 60 ? `Saved ${m}m ago` : `Saved ${at.toLocaleTimeString()}`
}

async function exportEditorPdf(filename: string) {
  const html2pdf = (await import('html2pdf.js')).default
  const element =
    document.querySelector('.docs-preview') ??
    document.querySelector('.docs-editor')
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

function EditorPreview({ content }: { content: Record<string, unknown> | null }) {
  const markdown = docToMarkdown(content)
  const isLegacy = markdown === '__LEGACY_TIPTAP__'

  if (isLegacy) {
    return (
      <div
        className="rounded-lg border px-4 py-3 text-[13px]"
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
          background: 'var(--color-surface-hover)',
        }}
      >
        This document was saved in the old format and cannot be previewed here.
      </div>
    )
  }

  if (!markdown) {
    return (
      <p style={{ color: 'var(--color-text-muted)' }}>No content yet.</p>
    )
  }

  return (
    <div className="docs-preview prose max-w-none text-[15px] leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{markdown}</ReactMarkdown>
    </div>
  )
}

function toEditorContent(
  value: Record<string, unknown> | string | null | undefined,
): Record<string, unknown> | null {
  if (value == null) return null
  if (typeof value === 'string') return markdownToDoc(value)
  return value
}

const MARKDOWN_SYSTEM_PROMPT = `You are a document writer. Output clean Markdown only — no explanation, no code fences, no preamble.

Use standard Markdown:
- # H1  ## H2  ### H3  #### H4 for headings
- **bold**  *italic*  ~~strikethrough~~  \`inline code\`
- - item or * item for bullet lists
- 1. item for numbered lists
- - [ ] task  - [x] done task for task lists
- > text for blockquotes
- \`\`\` for code blocks
- --- for horizontal rules
- [text](url) for links
- | col | col | for tables

Start the document directly. Do not say "Here is the document" or add any explanation.`

function AiCopyWidget() {
  const [copied, setCopied] = useState(false)
  const [expanded, setExpanded] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(MARKDOWN_SYSTEM_PROMPT)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className="rounded-xl border p-4 flex flex-col gap-3"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <div className="flex items-center gap-2">
        <Wand2 size={14} style={{ color: 'var(--color-accent)' }} />
        <p
          className="text-[12px] font-semibold"
          style={{ color: 'var(--color-text-heading)' }}
        >
          AI Formatting
        </p>
      </div>
      <p
        className="text-[11px] leading-relaxed"
        style={{ color: 'var(--color-text-muted)' }}
      >
        Copy this prompt into any AI, ask it to write your document, then paste
        the Markdown response directly into the editor.
      </p>
      <div
        className="rounded-lg border overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <div
          className="flex items-center justify-between px-3 py-2 border-b"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface-hover)',
          }}
        >
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            System Prompt
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="flex items-center gap-1 text-[11px] px-2 py-0.5 rounded hover:bg-[var(--color-border)] transition-colors"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {expanded ? (
                <>
                  <ChevronUp size={10} /> Hide
                </>
              ) : (
                <>
                  <ChevronDown size={10} /> Preview
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className={cn(
                'flex items-center gap-1 text-[11px] px-2 py-0.5 rounded transition-colors font-medium',
                copied
                  ? 'text-[var(--color-success)]'
                  : 'text-[var(--color-accent)] hover:bg-[var(--color-accent-subtle)]',
              )}
            >
              {copied ? (
                <>
                  <Check size={10} /> Copied!
                </>
              ) : (
                <>
                  <Copy size={10} /> Copy
                </>
              )}
            </button>
          </div>
        </div>
        {expanded && (
          <pre
            className="text-[10px] p-3 overflow-auto max-h-[200px] leading-relaxed whitespace-pre-wrap"
            style={{
              color: 'var(--color-text-secondary)',
              background: 'var(--color-page)',
              fontFamily: 'monospace',
            }}
          >
            {MARKDOWN_SYSTEM_PROMPT}
          </pre>
        )}
      </div>
    </div>
  )
}

interface DocEditorProps {
  doc?: InternalDoc | null
  docId?: string
}

export function DocEditor({ doc, docId }: DocEditorProps) {
  const router = useRouter()
  const { profile } = useAuth()
  const createDoc = useCreateInternalDoc()
  const updateDoc = useUpdateInternalDoc()
  const deleteDoc = useDeleteInternalDoc()

  const editorRef = useRef<RichDocEditorHandle>(null)
  const [title, setTitle] = useState(doc?.title ?? '')
  const [content, setContent] = useState<Record<string, unknown> | null>(
    toEditorContent(doc?.content),
  )
  const [category, setCategory] = useState<DocCategory>(doc?.category ?? 'Other')
  const [status, setStatus] = useState<DocStatus>(doc?.status ?? 'draft')
  const [isShared, setIsShared] = useState(doc?.is_shared ?? false)
  const [tags, setTags] = useState((doc?.tags ?? []).join(', '))
  const [currentDocId, setCurrentDocId] = useState<string | null>(
    doc?.id ?? docId ?? null,
  )
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    doc?.updated_at ? new Date(doc.updated_at) : null,
  )
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [savedAgo, setSavedAgo] = useState('Not saved')
  const [previewMode, setPreviewMode] = useState(false)

  const canEdit = !doc || canEditDoc(profile, { author_id: doc.author_id })
  const canDelete = doc
    ? canDeleteDoc(profile, { author_id: doc.author_id })
    : false
  const isSaving = createDoc.isPending || updateDoc.isPending

  useEffect(() => {
    if (!doc) return
    setTitle(doc.title)
    setContent(toEditorContent(doc.content))
    setCategory(doc.category)
    setStatus(doc.status)
    setIsShared(doc.is_shared)
    setTags((doc.tags ?? []).join(', '))
    setCurrentDocId(doc.id)
    setLastSavedAt(doc.updated_at ? new Date(doc.updated_at) : null)
  }, [doc])

  useEffect(() => {
    const interval = window.setInterval(() => {
      setSavedAgo(formatSavedAgo(lastSavedAt))
    }, 5000)
    setSavedAgo(formatSavedAgo(lastSavedAt))
    return () => window.clearInterval(interval)
  }, [lastSavedAt])

  const save = useCallback(
    async (overrides?: Partial<{
      title: string
      content: Record<string, unknown> | null
      category: DocCategory
      status: DocStatus
      is_shared: boolean
      tags: string[]
    }>) => {
      const nextTitle = (overrides?.title ?? title).trim() || 'Untitled'
      const nextContent = overrides?.content ?? content
      const data = {
        title: nextTitle,
        content: nextContent,
        category: overrides?.category ?? category,
        status: overrides?.status ?? status,
        is_shared: overrides?.is_shared ?? isShared,
        tags:
          overrides?.tags ??
          tags
            .split(',')
            .map((t) => t.trim())
            .filter(Boolean),
        excerpt: (() => {
          if (!nextContent) return undefined
          const md = docToMarkdown(nextContent)
          if (md === '__LEGACY_TIPTAP__') {
            return JSON.stringify(nextContent).slice(0, 200)
          }
          return md.replace(/[#*`>\-\[\]|]/g, '').trim().slice(0, 200)
        })(),
      }

      if (!currentDocId && !title.trim() && !content) return

      try {
        if (currentDocId) {
          await updateDoc.mutateAsync({ id: currentDocId, data })
        } else {
          const created = await createDoc.mutateAsync(data)
          setCurrentDocId(created.id)
          router.replace(ROUTES.DOC(created.id))
        }
        setLastSavedAt(new Date())
        setSavedAgo('Saved just now')
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    },
    [
      title,
      content,
      category,
      status,
      isShared,
      tags,
      currentDocId,
      createDoc,
      updateDoc,
      router,
    ],
  )

  useEffect(() => {
    if (!canEdit) return
    const interval = window.setInterval(() => void save(), 30_000)
    return () => window.clearInterval(interval)
  }, [save, canEdit])

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
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.push(ROUTES.DOCS)}
            className="flex items-center gap-1 text-[13px] hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <ChevronLeft size={15} />
            Docs
          </button>
          <select
            value={status}
            disabled={!canEdit || isSaving}
            onChange={(e) => {
              const v = e.target.value as DocStatus
              setStatus(v)
              void save({ status: v })
            }}
            className="h-[28px] px-2 rounded-lg text-[12px] border outline-none disabled:opacity-50"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-body)',
            }}
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1.5">
          {isSaving ? (
            <span className="w-3 h-3 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          ) : (
            <Clock size={12} style={{ color: 'var(--color-text-muted)' }} />
          )}
          <span
            className="text-[11px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {isSaving ? 'Saving...' : savedAgo}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {!canEdit && (
            <span
              className="text-[12px] px-3 py-1 rounded-lg border"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              Read-only
            </span>
          )}

          {canEdit && (
            <button
              type="button"
              onClick={() => setPreviewMode((v) => !v)}
              className="flex items-center gap-1.5 h-[32px] px-3 rounded-lg text-[12px] font-medium border hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-body)',
              }}
            >
              {previewMode ? (
                <>
                  <Pencil size={13} />
                  Edit
                </>
              ) : (
                <>
                  <Eye size={13} />
                  Preview
                </>
              )}
            </button>
          )}

          {canEdit && (
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
          {canDelete && (
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className="flex items-center gap-1.5 h-[32px] px-3 rounded-lg text-[12px] font-medium hover:bg-[var(--color-danger-bg)] transition-colors"
              style={{ color: 'var(--color-danger)' }}
            >
              <Trash2 size={13} />
              Delete
            </button>
          )}
        </div>
      </div>

      {!canEdit && doc && (
        <div
          className="flex items-center gap-2 px-6 py-2 text-[12px]"
          style={{
            background: 'var(--color-warning-bg)',
            color: 'var(--color-warning)',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          <Eye size={13} />
          You are viewing this document in read-only mode. Only the author can
          edit it.
        </div>
      )}

      <div className="flex flex-1 gap-0 overflow-hidden">
        <div className="flex-1 overflow-auto">
          <div className="max-w-[800px] mx-auto px-8 py-8">
            {canEdit && !previewMode ? (
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={() => void save()}
                placeholder="Document title..."
                className="w-full text-[32px] font-bold bg-transparent outline-none mb-3 placeholder:text-[var(--color-text-muted)]"
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

            {doc?.author && (
              <div
                className="flex items-center gap-2 mb-3 pb-3 border-b"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <Avatar
                  name={doc.author.full_name ?? 'Unknown'}
                  src={doc.author.avatar_url}
                  size="xs"
                />
                <span
                  className="text-[12px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {doc.author.full_name} ·{' '}
                  {new Date(doc.updated_at).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </span>
              </div>
            )}

            {previewMode || !canEdit ? (
              <EditorPreview content={content} />
            ) : (
              <RichDocEditor
                ref={editorRef}
                content={content}
                onChange={(c) => setContent(c)}
                editable={true}
                placeholder="Start writing your document..."
              />
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
            {canEdit && (
              <div className="flex flex-col gap-3">
                <p
                  className="text-[10px] font-semibold uppercase tracking-[0.06em]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Document Settings
                </p>
                <div>
                  <label
                    className="block text-[10px] font-semibold uppercase tracking-[0.06em] mb-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => {
                      const v = e.target.value as DocCategory
                      setCategory(v)
                      void save({ category: v })
                    }}
                    className="w-full h-[34px] px-2 rounded-lg text-[12px] border outline-none focus:border-[var(--color-accent)]"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-page)',
                      color: 'var(--color-text-body)',
                    }}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    className="block text-[10px] font-semibold uppercase tracking-[0.06em] mb-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    Tags
                  </label>
                  <input
                    type="text"
                    value={tags}
                    onChange={(e) => setTags(e.target.value)}
                    onBlur={() => void save()}
                    placeholder="sop, process, hr"
                    className="w-full h-[34px] px-2.5 rounded-lg text-[12px] border outline-none focus:border-[var(--color-accent)]"
                    style={{
                      borderColor: 'var(--color-border)',
                      background: 'var(--color-page)',
                      color: 'var(--color-text-body)',
                    }}
                  />
                </div>
                <label className="flex items-center justify-between cursor-pointer">
                  <span
                    className="text-[12px]"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    Shared with team
                  </span>
                  <input
                    type="checkbox"
                    checked={isShared}
                    onChange={(e) => {
                      setIsShared(e.target.checked)
                      void save({ is_shared: e.target.checked })
                    }}
                    className="w-4 h-4 accent-[var(--color-accent)]"
                  />
                </label>
              </div>
            )}

            {canEdit && <AiCopyWidget />}
          </div>
        </div>
      </div>

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
              <span
                className="font-semibold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                {title || 'this document'}
              </span>
              . This cannot be undone.
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
