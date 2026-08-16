import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { getProjectStatus } from '@/constants/project-status'
import type { ActiveProject } from '@/server/reports/reports.server'

interface ActiveProjectsTableProps {
  projects: ActiveProject[]
}

export function ActiveProjectsTable({ projects }: ActiveProjectsTableProps) {
  if (projects.length === 0) {
    return (
      <div className="rounded-xl border bg-[var(--color-surface)] p-8 text-center" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>No active projects</p>
      </div>
    )
  }

  return (
    <div className="rounded-xl border bg-[var(--color-surface)]" style={{ borderColor: 'var(--color-border)' }}>
      <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
        <p className="text-[14px] font-semibold" style={{ color: 'var(--color-text-heading)' }}>Active Projects</p>
      </div>

      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {['Project', 'Status', 'Completion', 'Deadline', 'Days Left', 'Team'].map((col, i) => (
              <th
                key={i}
                className={cn(
                  'py-3 text-[11px] font-semibold uppercase tracking-[0.06em]',
                  i === 0 ? 'text-left pl-5' : i === 5 ? 'text-left pr-5 w-[80px]' : 'text-left',
                )}
                style={{ color: 'var(--color-text-muted)' }}
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {projects.map((proj, i) => {
            const status = getProjectStatus(proj.status)
            const isUrgent = proj.daysLeft !== null && proj.daysLeft <= 14
            const isOverdue = proj.daysLeft !== null && proj.daysLeft < 0

            return (
              <tr key={proj.id} style={{ borderBottom: i < projects.length - 1 ? '1px solid var(--color-border)' : undefined }}>
                <td className="py-3.5 pl-5 pr-4">
                  <span className="text-[13px] font-semibold" style={{ color: 'var(--color-text-heading)' }}>{proj.name}</span>
                </td>
                <td className="py-3.5 pr-4 w-[130px]">
                  <span className="text-[12px] font-medium" style={{ color: status.badgeText }}>{status.label}</span>
                </td>
                <td className="py-3.5 pr-4 w-[220px]">
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-[5px] rounded-full overflow-hidden" style={{ background: 'var(--color-border)' }}>
                      <div className="h-full rounded-full" style={{ width: `${proj.pct}%`, background: 'var(--color-accent)' }} />
                    </div>
                    <span className="text-[12px] tabular-nums shrink-0 w-7 text-right" style={{ color: 'var(--color-text-secondary)' }}>
                      {proj.pct}%
                    </span>
                  </div>
                </td>
                <td className="py-3.5 pr-4 w-[110px]">
                  <span className="text-[12px] tabular-nums" style={{ color: 'var(--color-text-muted)' }}>
                    {proj.deadline ?? '—'}
                  </span>
                </td>
                <td className="py-3.5 pr-4 w-[90px]">
                  <span
                    className="text-[12px] font-medium tabular-nums"
                    style={{
                      color: isOverdue
                        ? 'var(--color-danger)'
                        : isUrgent
                          ? 'var(--color-warning)'
                          : 'var(--color-text-secondary)',
                    }}
                  >
                    {proj.daysLeft === null ? '—' : isOverdue ? `${Math.abs(proj.daysLeft)}d late` : `${proj.daysLeft}d`}
                  </span>
                </td>
                <td className="py-3.5 pr-5 w-[80px]">
                  <div className="flex items-center">
                    {proj.team.map((member, mi) => (
                      <div key={mi} className="ring-2 ring-white rounded-full" style={{ marginLeft: mi > 0 ? '-6px' : '0' }}>
                        <Avatar name={member.name} src={member.avatar} size="xs" />
                      </div>
                    ))}
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
