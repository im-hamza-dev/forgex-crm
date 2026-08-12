import { cn } from '@/lib/utils'
import type { Project } from '@/types/projects'

export function ProjectMilestonesTab({ project }: { project: Project }) {
  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)]"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {project.milestones.map((milestone, i) => {
        const isComplete = !!milestone.completed_at
        return (
          <div
            key={milestone.id}
            className="flex items-start gap-4 px-5 py-4"
            style={{
              borderBottom:
                i < project.milestones.length - 1
                  ? '1px solid var(--color-border)'
                  : undefined,
            }}
          >
            <div
              className={cn(
                'w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 transition-colors',
              )}
              style={{
                borderColor: isComplete
                  ? 'var(--color-accent)'
                  : 'var(--color-border-strong)',
                background: isComplete ? 'var(--color-accent)' : 'transparent',
              }}
            />
            <div>
              <p
                className={cn(
                  'text-[14px] font-semibold',
                  isComplete && 'font-bold',
                )}
                style={{ color: 'var(--color-text-heading)' }}
              >
                {milestone.title}
              </p>
              <p
                className="text-[12px] mt-0.5"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Due {milestone.due_date}
              </p>
            </div>
          </div>
        )
      })}

      <button
        type="button"
        className={cn(
          'w-full py-3.5 text-[13px] border-t border-dashed',
          'transition-colors hover:bg-[var(--color-surface-hover)]',
        )}
        style={{
          borderColor: 'var(--color-border)',
          color: 'var(--color-text-muted)',
        }}
      >
        + Add Milestone
      </button>
    </div>
  )
}
