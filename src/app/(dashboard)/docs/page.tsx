'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout'
import { DocsSidebar, DocsListPanel, type DocsFilter } from '@/components/docs'
import { MOCK_DOCS } from '@/components/docs/mock-data'
import { ROUTES } from '@/constants/routes'
import type { Doc } from '@/types/docs'

export default function DocsPage() {
  const router = useRouter()
  const [filter, setFilter] = useState<DocsFilter>('all')

  const handleDocClick = (doc: Doc) => {
    router.push(ROUTES.DOC(doc.id))
  }

  const handleNewDoc = () => {
    router.push(ROUTES.DOC_NEW)
  }

  return (
    <DashboardShell title="Docs" notificationCount={3}>
      <div className="flex gap-4 items-start">
        <DocsSidebar active={filter} onChange={setFilter} />
        <DocsListPanel
          docs={MOCK_DOCS}
          filter={filter}
          onDocClick={handleDocClick}
          onNewDoc={handleNewDoc}
        />
      </div>
    </DashboardShell>
  )
}
