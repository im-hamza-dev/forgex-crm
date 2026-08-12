import { notFound } from 'next/navigation'
import { MOCK_DOCS } from '@/components/docs/mock-data'
import { DocEditor } from '@/components/docs'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditDocPage({ params }: Props) {
  const { id } = await params
  const doc = MOCK_DOCS.find((d) => d.id === id)
  if (!doc) notFound()
  return <DocEditor doc={doc} />
}
