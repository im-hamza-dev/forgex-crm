'use client'

import { Lock, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { canEditDoc } from '@/lib/docs-permissions'
import type { AuthProfile } from '@/stores/auth-store'
import type { DocsFilter } from './DocsSidebar'
import type { InternalDoc } from '@/types/docs'

interface DocsListPanelProps {
  docs: InternalDoc[]
  filter: DocsFilter
  isLoading?: boolean
  onDocClick: (doc: InternalDoc) => void
  onNewDoc?: () => void
  profile: AuthProfile | null
}

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - then)
  const m = Math.floor(diff / 60_000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
}

function applyLocalFilter(docs: InternalDoc[], filter: DocsFilter): InternalDoc[] {
  if (filter === 'shared') return docs.filter((d) => d.is_shared)
  return docs
}

export function DocsListPanel({
  docs,
  filter,
  isLoading = false,
  onDocClick,
  onNewDoc,
  profile,
}: DocsListPanelProps) {
  const filtered = applyLocalFilter(docs, filter)

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          {isLoading
            ? 'Loading…'
            : `${filtered.length} document${filtered.length !== 1 ? 's' : ''}`}
        </p>
        {onNewDoc && (
          <button
            type="button"
            onClick={onNewDoc}
            className="h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white transition-colors hover:bg-[var(--color-accent-hover)]"
            style={{ background: 'var(--color-accent)' }}
          >
            + New Doc
          </button>
        )}
      </div>

      <div
        className="rounded-xl border bg-[var(--color-surface)] overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {isLoading && (
          <div className="flex flex-col">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-[72px] animate-pulse border-b last:border-b-0"
                style={{
                  background: 'var(--color-surface-hover)',
                  borderColor: 'var(--color-border)',
                }}
              />
            ))}
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="py-16 text-center">
            <p
              className="text-[14px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No docs in this category
            </p>
          </div>
        )}

        {!isLoading &&
          filtered.map((doc, i) => {
            const readOnly = !canEditDoc(profile, { author_id: doc.author_id })
            const authorName = doc.author?.full_name ?? 'Unknown'

            return (
              <div
                key={doc.id}
                role="button"
                tabIndex={0}
                onClick={() => onDocClick(doc)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') onDocClick(doc)
                }}
                className={cn(
                  'flex items-center gap-3 px-5 py-4 cursor-pointer',
                  'transition-colors hover:bg-[var(--color-surface-hover)]',
                  i < filtered.length - 1 && 'border-b',
                )}
                style={{ borderColor: 'var(--color-border)' }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <span
                      className="text-[15px] font-semibold truncate"
                      style={{ color: 'var(--color-text-heading)' }}
                    >
                      {doc.title}
                    </span>
                    {!doc.is_shared && (
                      <Lock
                        size={13}
                        className="shrink-0"
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                    )}
                    {readOnly && (
                      <span
                        className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-full shrink-0"
                        style={{
                          background: 'var(--color-surface-hover)',
                          color: 'var(--color-text-muted)',
                        }}
                      >
                        <Eye size={10} />
                        Read-only
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        background: 'var(--color-accent-subtle)',
                        color: 'var(--color-accent)',
                      }}
                    >
                      {doc.category}
                    </span>
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-medium"
                      style={{
                        background:
                          doc.status === 'published'
                            ? 'var(--color-success-bg)'
                            : 'var(--color-surface-hover)',
                        color:
                          doc.status === 'published'
                            ? 'var(--color-success)'
                            : 'var(--color-text-muted)',
                      }}
                    >
                      {doc.status === 'published' ? 'Published' : 'Draft'}
                    </span>
                    {(doc.tags ?? []).slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[11px]"
                        style={{ color: 'var(--color-text-muted)' }}
                      >
                        #{tag}
                      </span>
                    ))}
                    <Avatar
                      name={authorName}
                      src={doc.author?.avatar_url}
                      size="xs"
                    />
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {authorName.split(' ')[0]}
                    </span>
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      · {formatRelative(doc.updated_at)}
                    </span>
                    {doc.last_editor?.full_name &&
                      doc.last_edited_by !== doc.author_id && (
                        <span
                          className="text-[11px]"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          · edited by {doc.last_editor.full_name.split(' ')[0]}
                        </span>
                      )}
                  </div>
                </div>
              </div>
            )
          })}
      </div>
    </div>
  )
}
