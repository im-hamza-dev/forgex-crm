import { notFound } from 'next/navigation'
import { MOCK_POSTS } from '@/components/blog/mock-data'
import { BlogEditor } from '@/components/blog'

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditBlogPostPage({ params }: Props) {
  const { id } = await params
  const post = MOCK_POSTS.find((p) => p.id === id)
  if (!post) notFound()
  return <BlogEditor post={post} />
}
