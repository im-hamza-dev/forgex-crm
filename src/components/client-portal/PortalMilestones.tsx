'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface Milestone {
  id: string
  title: string
  state: 'completed' | 'active' | 'upcoming' | 'overdue'
  completedDate?: string
  dueDate?: string
}

interface PortalMilestonesProps {
  milestones: Milestone[]
}

export function PortalMilestones({ milestones }: PortalMilestonesProps) {
  return (
    <div
      className="rounded-xl border p-4 sm:p-6"
      style={{
        background: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      <h3
        className="text-[15px] font-semibold mb-5"
        style={{ color: 'var(--color-text-heading)' }}
      >
        Milestones
      </h3>

      <div className="flex flex-col">
        {milestones.map((milestone, i) => {
          const isLast = i === milestones.length - 1

          return (
            <div key={milestone.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div
                  className={cn(
                    'w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 z-10',
                  )}
                  style={{
                    background:
                      milestone.state === 'completed'
                        ? '#2D6A2D'
                        : milestone.state === 'active'
                          ? 'var(--color-accent)'
                          : milestone.state === 'overdue'
                            ? '#FDF0F0'
                            : 'transparent',
                    border:
                      milestone.state === 'upcoming'
                        ? '2px solid #E8E8E8'
                        : milestone.state === 'overdue'
                          ? '2px solid #8B1A1A'
                          : 'none',
                  }}
                >
                  {milestone.state === 'completed' && (
                    <Check size={12} color="white" strokeWidth={2.5} />
                  )}
                  {milestone.state === 'active' && (
                    <div className="w-[7px] h-[7px] rounded-full bg-white" />
                  )}
                </div>

                {!isLast && (
                  <div
                    className="w-px flex-1 my-1"
                    style={{
                      background: 'var(--color-border)',
                      minHeight: '28px',
                    }}
                  />
                )}
              </div>

              <div className={cn('flex-1 pb-5', isLast && 'pb-0')}>
                <p
                  className={cn(
                    'text-[14px] font-semibold leading-tight',
                    milestone.state === 'completed' && 'line-through',
                  )}
                  style={{
                    color:
                      milestone.state === 'completed'
                        ? 'var(--color-text-muted)'
                        : milestone.state === 'upcoming'
                          ? 'var(--color-text-secondary)'
                          : 'var(--color-text-heading)',
                    textDecorationColor: 'var(--color-text-muted)',
                  }}
                >
                  {milestone.title}
                </p>

                <div className="flex items-center gap-2 mt-1">
                  {milestone.state === 'completed' && milestone.completedDate && (
                    <span className="text-[12px]" style={{ color: '#2D6A2D' }}>
                      Completed {milestone.completedDate}
                    </span>
                  )}

                  {milestone.state === 'active' && (
                    <>
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#FEF7E6', color: '#8B5E00' }}
                      >
                        In Progress
                      </span>
                      {milestone.dueDate && (
                        <span
                          className="text-[12px]"
                          style={{ color: 'var(--color-text-muted)' }}
                        >
                          Due {milestone.dueDate}
                        </span>
                      )}
                    </>
                  )}

                  {milestone.state === 'upcoming' && milestone.dueDate && (
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      Due {milestone.dueDate}
                    </span>
                  )}

                  {milestone.state === 'overdue' && milestone.dueDate && (
                    <span
                      className="text-[12px] font-medium"
                      style={{ color: '#8B1A1A' }}
                    >
                      Overdue · Was due {milestone.dueDate}
                    </span>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
