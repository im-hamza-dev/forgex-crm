'use client'

import { useState, useEffect, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout'
import { DocsSidebar, DocsListPanel } from '@/components/docs'
import { useAuth } from '@/hooks/useAuth'
import { useInternalDocs, useClientDocuments } from '@/hooks/useDocs'
import {
  canCreateDoc,
  canManageClientDocs,
  canViewClientDocs,
} from '@/lib/docs-permissions'
import { ROUTES } from '@/constants/routes'
import type { DocsFilter } from '@/components/docs'
import type { ClientDocument, InternalDoc } from '@/types/docs'

type DocsTab = 'internal' | 'client'

function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value)
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), delay)
    return () => window.clearTimeout(t)
  }, [value, delay])
  return debounced
}

export default function DocsPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const [activeTab, setActiveTab] = useState<DocsTab>('internal')
  const [filter, setFilter] = useState<DocsFilter>('all')
  const [search, setSearch] = useState('')
  const debouncedSearch = useDebouncedValue(search, 300)

  const showClientTab = canViewClientDocs(profile)

  const internalFilters = useMemo(
    () => ({
      category:
        filter !== 'all' && filter !== 'my' && filter !== 'shared'
          ? filter
          : undefined,
      my_only: filter === 'my',
      search: debouncedSearch || undefined,
    }),
    [filter, debouncedSearch],
  )

  const { data: internalDocs = [], isLoading: internalLoading } =
    useInternalDocs(internalFilters)

  const { data: clientDocs = [], isLoading: clientLoading } =
    useClientDocuments(showClientTab && activeTab === 'client')

  const handleDocClick = (doc: InternalDoc) => {
    router.push(ROUTES.DOC(doc.id))
  }

  const handleNewDoc = () => {
    router.push(ROUTES.DOC_NEW)
  }

  const handleNewClientDoc = () => {
    router.push(ROUTES.DOC_CLIENT_NEW)
  }

  return (
    <DashboardShell title="Docs" notificationCount={0}>
      <div
        className="flex items-center gap-1 mb-5 p-1 rounded-xl w-fit"
        style={{ background: 'var(--color-surface-hover)' }}
      >
        {(
          [
            { value: 'internal' as const, label: 'Internal Docs' },
            ...(showClientTab
              ? [{ value: 'client' as const, label: 'Client Documents' }]
              : []),
          ] as { value: DocsTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setActiveTab(tab.value)}
            className="h-[32px] px-4 rounded-lg text-[13px] font-medium transition-colors"
            style={
              activeTab === tab.value
                ? {
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-heading)',
                    boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                  }
                : { color: 'var(--color-text-secondary)' }
            }
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'internal' && (
        <div className="flex gap-4 items-start">
          <DocsSidebar
            active={filter}
            onChange={setFilter}
            search={search}
            onSearchChange={setSearch}
          />
          <DocsListPanel
            docs={internalDocs}
            filter={filter}
            isLoading={internalLoading}
            onDocClick={handleDocClick}
            onNewDoc={canCreateDoc(profile) ? handleNewDoc : undefined}
            profile={profile}
          />
        </div>
      )}

      {activeTab === 'client' && showClientTab && (
        <ClientDocsList
          docs={clientDocs}
          isLoading={clientLoading}
          canManage={canManageClientDocs(profile)}
          onNewDoc={handleNewClientDoc}
          onDocClick={(doc) => router.push(ROUTES.DOC_CLIENT(doc.id))}
        />
      )}
    </DashboardShell>
  )
}

function ClientDocsList({
  docs,
  isLoading,
  canManage,
  onNewDoc,
  onDocClick,
}: {
  docs: ClientDocument[]
  isLoading: boolean
  canManage: boolean
  onNewDoc: () => void
  onDocClick: (doc: ClientDocument) => void
}) {
  const DOCUMENT_TYPE_LABELS: Record<string, string> = {
    welcome: 'Welcome Letter',
    nda: 'NDA',
    thankyou: 'Thank You',
    recommendation: 'Recommendation',
    proposal: 'Proposal',
    contract: 'Contract',
    other: 'Other',
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
          {docs.length} document{docs.length !== 1 ? 's' : ''}
        </p>
        {canManage && (
          <button
            type="button"
            onClick={onNewDoc}
            className="h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            + New Document
          </button>
        )}
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-[72px] rounded-xl animate-pulse border"
              style={{
                background: 'var(--color-surface-hover)',
                borderColor: 'var(--color-border)',
              }}
            />
          ))}
        </div>
      )}

      {!isLoading && docs.length === 0 && (
        <div
          className="rounded-xl border py-16 text-center"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          <p
            className="text-[15px] font-semibold mb-1"
            style={{ color: 'var(--color-text-heading)' }}
          >
            No client documents yet
          </p>
          <p
            className="text-[13px]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Create welcome letters, NDAs, and other documents to send to
            clients.
          </p>
        </div>
      )}

      {!isLoading && docs.length > 0 && (
        <div
          className="rounded-xl border overflow-hidden"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
          }}
        >
          {docs.map((doc, i) => (
            <div
              key={doc.id}
              role="button"
              tabIndex={0}
              onClick={() => onDocClick(doc)}
              onKeyDown={(e) => e.key === 'Enter' && onDocClick(doc)}
              className="flex items-center gap-4 px-5 py-4 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
              style={{
                borderBottom:
                  i < docs.length - 1
                    ? '1px solid var(--color-border)'
                    : undefined,
              }}
            >
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] font-semibold truncate"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  {doc.title}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span
                    className="text-[11px] px-2 py-0.5 rounded-full"
                    style={{
                      background: 'var(--color-accent-subtle)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {DOCUMENT_TYPE_LABELS[doc.document_type] ??
                      doc.document_type}
                  </span>
                  <span
                    className="text-[11px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {doc.content_type === 'pdf' ? 'PDF' : 'Editor'}
                  </span>
                  {(doc.sends?.length ?? 0) > 0 && (
                    <span
                      className="text-[11px]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      · Sent to {doc.sends?.length} client
                      {(doc.sends?.length ?? 0) !== 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </div>
              <span
                className="text-[11px] shrink-0"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {new Date(doc.updated_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
