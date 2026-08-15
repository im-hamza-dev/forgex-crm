'use client'

import { use } from 'react'
import { ClientDocEditor } from '@/components/docs/ClientDocEditor'
import { useClientDocument } from '@/hooks/useDocs'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

export default function EditClientDocPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = use(params)
  const isValid = UUID_REGEX.test(id)
  const { data: doc, isLoading } = useClientDocument(isValid ? id : null)

  if (!isValid) return null

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--color-page)]">
        <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
      </div>
    )
  }

  return <ClientDocEditor doc={doc ?? null} />
}
