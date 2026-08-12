import { notFound } from 'next/navigation'
import { MOCK_PROJECTS } from '@/components/projects/mock-data'
import { ProjectDetail } from '@/components/projects'

interface Props {
  params: Promise<{ id: string }>
}

export default async function ProjectDetailPage({ params }: Props) {
  const { id } = await params
  const project = MOCK_PROJECTS.find((p) => p.id === id)
  if (!project) notFound()
  return <ProjectDetail project={project} />
}
