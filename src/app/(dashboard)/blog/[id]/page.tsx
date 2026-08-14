import { notFound } from 'next/navigation'
import { BlogEditor } from '@/components/blog'

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params
  if (!UUID_REGEX.test(id)) notFound()
  return <BlogEditor postId={id} />
}
