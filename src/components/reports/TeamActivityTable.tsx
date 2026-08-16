import { Avatar } from '@/components/ui'
import type { TeamStat } from '@/server/reports/reports.server'

interface TeamActivityTableProps {
  stats: TeamStat[]
}

export function TeamActivityTable({ stats }: TeamActivityTableProps) {
  return (
    <div className="rounded-xl border bg-[var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-heading)' }}>Team Activity</p>
      </div>

      {stats.length === 0 ? (
        <div className="p-8 text-center">
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>No team data yet</p>
        </div>
      ) : (
        <div>
          {stats.map((member, i) => {
            const barPct = member.totalTasks > 0
              ? Math.round((member.tasksCompleted / member.totalTasks) * 100)
              : 0
            const firstName = member.name.split(' ')[0] ?? member.name
            const lastInitial = member.name.split(' ')[1]?.charAt(0)

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 px-5 py-4"
                style={{ borderBottom: i < stats.length - 1 ? '1px solid var(--color-border)' : undefined }}
              >
                <div className="flex items-center gap-2.5 w-[140px] shrink-0">
                  <Avatar name={member.name} src={member.avatar} size="sm" />
                  <span className="text-[13px] font-semibold truncate" style={{ color: 'var(--color-text-heading)' }}>
                    {firstName}{lastInitial ? ` ${lastInitial}.` : ''}
                  </span>
                </div>

                <div className="flex-1 flex flex-col gap-1">
                  <span className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                    {member.tasksCompleted} of {member.totalTasks} tasks completed
                  </span>
                  <div className="h-[6px] rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{ width: `${barPct}%`, background: 'var(--color-accent)' }}
                    />
                  </div>
                </div>

                <span className="text-[13px] font-semibold tabular-nums w-[36px] text-right shrink-0" style={{ color: 'var(--color-text-heading)' }}>
                  {barPct}%
                </span>

                <span className="text-[12px] w-[60px] text-right shrink-0" style={{ color: 'var(--color-text-muted)' }}>
                  {member.leadsCount} leads
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
