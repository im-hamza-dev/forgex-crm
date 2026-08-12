'use client'

import { cn } from '@/lib/utils'
import { CALENDAR_STATUS_CONFIG } from '@/constants/calendar-config'
import type { CalendarEntry } from '@/types/calendar'

const DAY_HEADERS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function buildMonthGrid(year: number, month: number): (number | null)[] {
  const firstDay = new Date(year, month, 1)
  const startDow = (firstDay.getDay() + 6) % 7
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const cells: (number | null)[] = []
  for (let i = 0; i < startDow; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

interface CalendarGridProps {
  year: number
  month: number
  entries: CalendarEntry[]
  onEntryClick: (entry: CalendarEntry) => void
  onDayClick: (date: string) => void
}

export function CalendarGrid({
  year,
  month,
  entries,
  onEntryClick,
  onDayClick,
}: CalendarGridProps) {
  const today = new Date()
  const isToday = (day: number) =>
    today.getFullYear() === year &&
    today.getMonth() === month &&
    today.getDate() === day

  const cells = buildMonthGrid(year, month)

  const entriesByDate: Record<string, CalendarEntry[]> = {}
  entries.forEach((entry) => {
    const key = entry.planned_date
    if (!entriesByDate[key]) entriesByDate[key] = []
    entriesByDate[key]!.push(entry)
  })

  const pad = (n: number) => String(n).padStart(2, '0')
  const dateKey = (day: number) => `${year}-${pad(month + 1)}-${pad(day)}`

  return (
    <div
      className="rounded-xl border overflow-hidden"
      style={{
        borderColor: 'var(--color-border)',
        background: 'var(--color-surface)',
      }}
    >
      <div
        className="grid grid-cols-7 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        {DAY_HEADERS.map((d) => (
          <div
            key={d}
            className="py-2.5 text-center text-[11px] font-semibold uppercase tracking-[0.07em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {cells.map((day, i) => {
          const isLast = i >= cells.length - 7
          const colPos = i % 7
          const dayEntries = day ? (entriesByDate[dateKey(day)] ?? []) : []

          return (
            <div
              key={i}
              onClick={() => {
                if (day) onDayClick(dateKey(day))
              }}
              className={cn(
                'min-h-[100px] p-2 relative',
                !isLast && 'border-b',
                colPos < 6 && 'border-r',
                day && 'cursor-pointer hover:bg-[var(--color-surface-hover)]',
                !day && 'bg-[var(--color-page)]',
              )}
              style={{ borderColor: 'var(--color-border)' }}
            >
              {day && (
                <span
                  className={cn(
                    'inline-flex items-center justify-center text-[13px] leading-none mb-1.5',
                    isToday(day)
                      ? 'w-6 h-6 rounded-full font-semibold'
                      : 'font-normal',
                  )}
                  style={{
                    color: isToday(day)
                      ? 'var(--color-accent)'
                      : 'var(--color-text-secondary)',
                    border: isToday(day)
                      ? '1.5px solid var(--color-accent)'
                      : undefined,
                  }}
                >
                  {day}
                </span>
              )}

              <div className="flex flex-col gap-0.5">
                {dayEntries.map((entry) => {
                  const statusColor = CALENDAR_STATUS_CONFIG[entry.status]
                  return (
                    <button
                      type="button"
                      key={entry.id}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEntryClick(entry)
                      }}
                      className="w-full text-left px-1.5 py-0.5 rounded text-[11px] font-medium truncate transition-opacity hover:opacity-80"
                      style={{
                        background: statusColor.bg,
                        color: statusColor.text,
                      }}
                    >
                      {entry.title}
                    </button>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
