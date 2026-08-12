interface TasksStatsRowProps {
  dueToday: number
  overdue: number
  thisWeek: number
}

export function TasksStatsRow({ dueToday, overdue, thisWeek }: TasksStatsRowProps) {
  const chips = [
    {
      label: `${dueToday} due today`,
      bg: dueToday > 0 ? 'var(--color-warning-bg)' : 'var(--color-surface-hover)',
      color: dueToday > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
    },
    {
      label: `${overdue} overdue`,
      bg: overdue > 0 ? 'var(--color-danger-bg)' : 'var(--color-surface-hover)',
      color: overdue > 0 ? 'var(--color-danger)' : 'var(--color-text-muted)',
    },
    {
      label: `${thisWeek} this week`,
      bg: thisWeek > 0 ? 'var(--color-warning-bg)' : 'var(--color-surface-hover)',
      color: thisWeek > 0 ? 'var(--color-warning)' : 'var(--color-text-muted)',
    },
  ]

  return (
    <div className="flex items-center gap-2">
      {chips.map((chip) => (
        <span
          key={chip.label}
          className="inline-flex items-center px-3 h-[28px] rounded-full text-[12px] font-medium"
          style={{ background: chip.bg, color: chip.color }}
        >
          {chip.label}
        </span>
      ))}
    </div>
  )
}
