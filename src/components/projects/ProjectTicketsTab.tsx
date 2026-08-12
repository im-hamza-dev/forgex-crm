import type { Project } from '@/types/projects'

export function ProjectTicketsTab({ project: _project }: { project: Project }) {
  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)] py-16 text-center"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <p className="text-[14px]" style={{ color: 'var(--color-text-muted)' }}>
        No tickets raised
      </p>
    </div>
  )
}
