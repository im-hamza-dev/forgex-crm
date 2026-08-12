import { Avatar } from '@/components/ui'

const TEAM_STATS = [
  {
    name: 'Hamza Iqbal',
    avatar: null as string | null,
    tasks_completed: 37,
    max_tasks: 50,
    leads: 2,
  },
  {
    name: 'Sara Ahmed',
    avatar: null as string | null,
    tasks_completed: 27,
    max_tasks: 50,
    leads: 3,
  },
  {
    name: 'Zain Malik',
    avatar: null as string | null,
    tasks_completed: 8,
    max_tasks: 50,
    leads: 1,
  },
]

export function TeamActivityTable() {
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
          Team Activity
        </p>
      </div>

      <div>
        {TEAM_STATS.map((member, i) => {
          const barPct = Math.round(
            (member.tasks_completed / member.max_tasks) * 100,
          )

          return (
            <div
              key={member.name}
              className="flex items-center gap-4 px-5 py-4"
              style={{
                borderBottom:
                  i < TEAM_STATS.length - 1
                    ? '1px solid var(--color-border)'
                    : undefined,
              }}
            >
              <div className="flex items-center gap-2.5 w-[140px] shrink-0">
                <Avatar name={member.name} src={member.avatar} size="sm" />
                <span
                  className="text-[13px] font-semibold truncate"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  {member.name.split(' ')[0]}{' '}
                  {member.name.split(' ')[1]?.charAt(0)}.
                </span>
              </div>

              <div className="flex-1 flex flex-col gap-1">
                <span
                  className="text-[11px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Tasks completed
                </span>
                <div
                  className="h-[6px] rounded-full overflow-hidden"
                  style={{ background: 'var(--color-border)' }}
                >
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${barPct}%`,
                      background: 'var(--color-accent)',
                    }}
                  />
                </div>
              </div>

              <span
                className="text-[13px] font-semibold tabular-nums w-[36px] text-right shrink-0"
                style={{ color: 'var(--color-text-heading)' }}
              >
                {member.tasks_completed}
              </span>

              <span
                className="text-[12px] w-[52px] text-right shrink-0"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {member.leads} leads
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
