'use client'

import { useParams } from 'next/navigation'
import { notFound } from 'next/navigation'
import { DashboardShell } from '@/components/layout'
import { ProjectDetail } from '@/components/projects'
import { useProject } from '@/hooks/useProjects'
import { ROUTES } from '@/constants/routes'

export default function ProjectDetailPage() {
  const params = useParams()
  const idParam = params?.id
  const id = typeof idParam === 'string' ? idParam : null

  const { data: project, isLoading, isError, error } = useProject(id)

  if (!id) {
    notFound()
  }

  if (isLoading) {
    return (
      <DashboardShell
        title="Project"
        breadcrumb={[
          { label: 'Projects', href: ROUTES.PROJECTS },
          { label: 'Loading…' },
        ]}
        notificationCount={0}
      >
        <div className="flex flex-col gap-4">
          <div className="h-10 w-64 rounded-lg animate-pulse bg-[var(--color-surface-hover)]" />
          <div className="h-8 w-48 rounded-lg animate-pulse bg-[var(--color-surface-hover)]" />
          <div className="h-10 w-full max-w-xl rounded-lg animate-pulse bg-[var(--color-surface-hover)]" />
          <div className="grid grid-cols-[1fr_320px] gap-5 mt-2">
            <div className="h-[320px] rounded-xl animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]" />
            <div className="h-[320px] rounded-xl animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]" />
          </div>
        </div>
      </DashboardShell>
    )
  }

  if (isError || !project) {
    if (error) {
      console.error('[project detail]', error)
    }
    notFound()
  }

  return <ProjectDetail project={project} />
}
