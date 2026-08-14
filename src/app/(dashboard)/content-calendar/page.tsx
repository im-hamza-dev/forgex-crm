'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { DashboardShell } from '@/components/layout'
import {
  CalendarGrid,
  CalendarNav,
  PlanPostModal,
} from '@/components/content-calendar'
import { useAuth } from '@/hooks/useAuth'
import { useCalendarEntries } from '@/hooks/useCalendar'
import type { CalendarEntry } from '@/types/calendar'

export default function CalendarPage() {
  const router = useRouter()
  const { profile } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()
  const [selectedEntry, setSelectedEntry] = useState<CalendarEntry | null>(null)

  const { data: entries = [], isLoading } = useCalendarEntries(year, month)

  const goToPrev = () => {
    if (month === 0) {
      setMonth(11)
      setYear((y) => y - 1)
    } else setMonth((m) => m - 1)
  }

  const goToNext = () => {
    if (month === 11) {
      setMonth(0)
      setYear((y) => y + 1)
    } else setMonth((m) => m + 1)
  }

  const goToToday = () => {
    const t = new Date()
    setYear(t.getFullYear())
    setMonth(t.getMonth())
  }

  const handleDayClick = (date: string) => {
    setSelectedEntry(null)
    setSelectedDate(date)
    setModalOpen(true)
  }

  const handleEntryClick = (entry: CalendarEntry) => {
    if (entry.is_system && entry.source_type && entry.source_id) {
      if (entry.source_type === 'lead') {
        router.push(`/leads?open=${entry.source_id}`)
      } else if (
        entry.source_type === 'project' ||
        entry.source_type === 'milestone'
      ) {
        router.push(`/projects/${entry.source_id}`)
      } else if (entry.source_type === 'task') {
        router.push(`/tasks?open=${entry.source_id}`)
      } else if (entry.source_type === 'blog') {
        router.push(`/blog/${entry.source_id}`)
      }
      return
    }
    setSelectedEntry(entry)
    setSelectedDate(entry.planned_date)
    setModalOpen(true)
  }

  return (
    <DashboardShell title="Content Calendar" notificationCount={0}>
      <CalendarNav
        year={year}
        month={month}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        onPlanPost={() => {
          setSelectedEntry(null)
          setSelectedDate(undefined)
          setModalOpen(true)
        }}
      />

      {isLoading ? (
        <div className="grid grid-cols-7 gap-px mt-4">
          {Array.from({ length: 35 }).map((_, i) => (
            <div
              key={i}
              className="h-[100px] animate-pulse rounded-lg"
              style={{ background: 'var(--color-surface-hover)' }}
            />
          ))}
        </div>
      ) : (
        <CalendarGrid
          year={year}
          month={month}
          entries={entries}
          onEntryClick={handleEntryClick}
          onDayClick={handleDayClick}
          profile={profile}
        />
      )}

      <PlanPostModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false)
          setSelectedEntry(null)
        }}
        defaultDate={selectedDate}
        entry={selectedEntry}
        profile={profile}
      />
    </DashboardShell>
  )
}
