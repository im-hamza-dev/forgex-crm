import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import { getProjectStatus } from '@/constants/project-status'

const PROJECTS = [
  {
    name: 'Patient Acquisition System',
    status: 'in_progress',
    pct: 68,
    deadline: '2026-10-31',
    daysLeft: 81,
    team: [
      { name: 'Hamza Iqbal', avatar: null as string | null },
      { name: 'Sara Ahmed', avatar: null as string | null },
    ],
  },
  {
    name: 'B2B Pipeline OS',
    status: 'review',
    pct: 85,
    deadline: '2026-08-25',
    daysLeft: 14,
    team: [
      { name: 'Sara Ahmed', avatar: null as string | null },
      { name: 'Zain Malik', avatar: null as string | null },
    ],
  },
  {
    name: 'Coaching Growth Platform',
    status: 'discovery',
    pct: 12,
    deadline: '2026-11-30',
    daysLeft: 111,
    team: [
      { name: 'Hamza Iqbal', avatar: null as string | null },
      { name: 'Sara Ahmed', avatar: null as string | null },
      { name: 'Zain Malik', avatar: null as string | null },
    ],
  },
]

export function ActiveProjectsTable() {
  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)]"
      style={{ borderColor: 'var(--color-border)' }}
    >
      <div
        className="px-5 py-4 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <p
          className="text-[14px] font-semibold"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Active Projects
        </p>
      </div>

      <table className="w-full">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {[
              { label: 'Project', cls: 'text-left pl-5' },
              { label: 'Status', cls: 'text-left w-[130px]' },
              { label: 'Completion', cls: 'text-left w-[220px]' },
              { label: 'Deadline', cls: 'text-left w-[110px]' },
              { label: 'Days Left', cls: 'text-left w-[90px]' },
              { label: 'Team', cls: 'text-left pr-5 w-[80px]' },
            ].map((col, i) => (
              <th
                key={i}
                className={cn(
                  'py-3 text-[11px] font-semibold uppercase tracking-[0.06em]',
                  col.cls,
                )}
                style={{ color: 'var(--color-text-muted)' }}
              >
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {PROJECTS.map((proj, i) => {
            const status = getProjectStatus(proj.status)
            const isUrgent = proj.daysLeft <= 14

            return (
              <tr
                key={proj.name}
                style={{
                  borderBottom:
                    i < PROJECTS.length - 1
                      ? '1px solid var(--color-border)'
                      : undefined,
                }}
              >
                <td className="py-3.5 pl-5 pr-4">
                  <span
                    className="text-[13px] font-semibold"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {proj.name}
                  </span>
                </td>

                <td className="py-3.5 pr-4 w-[130px]">
                  <span
                    className="text-[12px] font-medium"
                    style={{ color: status.badgeText }}
                  >
                    {status.label}
                  </span>
                </td>

                <td className="py-3.5 pr-4 w-[220px]">
                  <div className="flex items-center gap-3">
                    <div
                      className="flex-1 h-[5px] rounded-full overflow-hidden"
                      style={{ background: 'var(--color-border)' }}
                    >
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${proj.pct}%`,
                          background: 'var(--color-accent)',
                        }}
                      />
                    </div>
                    <span
                      className="text-[12px] tabular-nums shrink-0 w-7 text-right"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {proj.pct}%
                    </span>
                  </div>
                </td>

                <td className="py-3.5 pr-4 w-[110px]">
                  <span
                    className="text-[12px] tabular-nums"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {proj.deadline}
                  </span>
                </td>

                <td className="py-3.5 pr-4 w-[90px]">
                  <span
                    className="text-[12px] font-medium tabular-nums"
                    style={{
                      color: isUrgent
                        ? 'var(--color-danger)'
                        : 'var(--color-text-secondary)',
                    }}
                  >
                    {proj.daysLeft}d
                  </span>
                </td>

                <td className="py-3.5 pr-5 w-[80px]">
                  <div className="flex items-center">
                    {proj.team.slice(0, 3).map((member, mi) => (
                      <div
                        key={mi}
                        className="ring-2 ring-white rounded-full"
                        style={{ marginLeft: mi > 0 ? '-6px' : '0' }}
                      >
                        <Avatar
                          name={member.name}
                          src={member.avatar}
                          size="xs"
                        />
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
