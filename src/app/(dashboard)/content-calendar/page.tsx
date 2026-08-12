'use client'

import { useState } from 'react'
import { DashboardShell } from '@/components/layout'
import {
  CalendarGrid,
  CalendarNav,
  PlanPostModal,
} from '@/components/content-calendar'
import { MOCK_ENTRIES } from '@/components/content-calendar/mock-data'
import type { CalendarEntry } from '@/types/calendar'

export default function CalendarPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth())
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState<string | undefined>()

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
    setSelectedDate(date)
    setModalOpen(true)
  }

  const handleEntryClick = (entry: CalendarEntry) => {
    console.log('Entry clicked:', entry.title)
  }

  return (
    <DashboardShell title="Content Calendar" notificationCount={3}>
      <CalendarNav
        year={year}
        month={month}
        onPrev={goToPrev}
        onNext={goToNext}
        onToday={goToToday}
        onPlanPost={() => {
          setSelectedDate(undefined)
          setModalOpen(true)
        }}
      />

      <CalendarGrid
        year={year}
        month={month}
        entries={MOCK_ENTRIES}
        onEntryClick={handleEntryClick}
        onDayClick={handleDayClick}
      />

      <PlanPostModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        defaultDate={selectedDate}
        onSave={(values) => console.log('Save entry:', values)}
      />
    </DashboardShell>
  )
}
