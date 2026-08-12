'use client'

import { useState } from 'react'
import { Search, Lock } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import type { DocsFilter } from './DocsSidebar'
import type { Doc, DocCategory } from '@/types/docs'

const CATEGORY_TAG_COLORS: Partial<
  Record<DocCategory, { bg: string; text: string }>
> = {
  SOPs: { bg: '#EEF3FA', text: '#1A3D6B' },
  Templates: { bg: '#EDF5ED', text: '#2D6A2D' },
  Research: { bg: '#F3EEF8', text: '#4A1D6B' },
  'Meeting Notes': { bg: '#FEF7E6', text: '#8B5E00' },
  Other: { bg: '#F5F5F5', text: '#6B6B6B' },
}

interface DocsListPanelProps {
  docs: Doc[]
  filter: DocsFilter
  onDocClick: (doc: Doc) => void
  onNewDoc: () => void
}

function filterDocs(docs: Doc[], filter: DocsFilter, search: string): Doc[] {
  let result = docs
  if (filter === 'private') result = result.filter((d) => !d.is_shared)
  else if (filter === 'shared') result = result.filter((d) => d.is_shared)
  else if (filter !== 'all') result = result.filter((d) => d.category === filter)

  if (search) {
    const q = search.toLowerCase()
    result = result.filter((d) => d.title.toLowerCase().includes(q))
  }
  return result
}

export function DocsListPanel({
  docs,
  filter,
  onDocClick,
  onNewDoc,
}: DocsListPanelProps) {
  const [search, setSearch] = useState('')
  const filtered = filterDocs(docs, filter, search)

  return (
    <div className="flex-1 min-w-0">
      <div className="flex items-center justify-between mb-3">
        <div className="relative flex-1 max-w-[320px]">
          <Search
            size={13}
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            style={{ color: 'var(--color-text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search docs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={cn(
              'h-[34px] pl-8 pr-3 w-full rounded-lg text-[13px]',
              'border outline-none transition-colors',
              'placeholder:text-[var(--color-text-muted)]',
              'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-body)',
            }}
          />
        </div>
        <button
          type="button"
          onClick={onNewDoc}
          className="h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white transition-colors ml-3 hover:bg-[var(--color-accent-hover)]"
          style={{ background: 'var(--color-accent)' }}
        >
          + New Doc
        </button>
      </div>

      <div
        className="rounded-xl border bg-[var(--color-surface)] overflow-hidden"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p
              className="text-[14px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              No docs in this category
            </p>
          </div>
        ) : (
          filtered.map((doc, i) => {
            const tagColor = CATEGORY_TAG_COLORS[doc.category] ?? {
              bg: '#F5F5F5',
              text: '#6B6B6B',
            }

            return (
              <div
                key={doc.id}
                onClick={() => onDocClick(doc)}
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
                      className="text-[15px] font-semibold"
                      style={{ color: 'var(--color-text-heading)' }}
                    >
                      {doc.title}
                    </span>
                    {!doc.is_shared && (
                      <Lock
                        size={13}
                        style={{ color: 'var(--color-text-muted)' }}
                      />
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded-full text-[11px] font-semibold"
                      style={{
                        background: tagColor.bg,
                        color: tagColor.text,
                      }}
                    >
                      {doc.category}
                    </span>
                    <Avatar
                      name={doc.author_name}
                      src={doc.author_avatar}
                      size="xs"
                    />
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {doc.author_name.split(' ')[0]}
                    </span>
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      · {doc.time_ago}
                    </span>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}
