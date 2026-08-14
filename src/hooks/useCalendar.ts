'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetch-client'
import { queryKeys } from '@/lib/query/keys'
import type { CalendarEntry, CalendarEntryInsert } from '@/types/calendar'

type ApiData<T> = { data: T }

export function useCalendarEntries(year: number, month: number) {
  return useQuery({
    queryKey: queryKeys.calendar.entries(year, month),
    queryFn: async () => {
      const res = await fetchClient<ApiData<CalendarEntry[]>>(
        `/api/calendar?year=${year}&month=${month}`,
      )
      return res.data
    },
  })
}

export function useCreateCalendarEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CalendarEntryInsert) => {
      const res = await fetchClient<ApiData<CalendarEntry>>('/api/calendar', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.calendar.all,
        exact: false,
      })
    },
  })
}

export function useUpdateCalendarEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Partial<CalendarEntryInsert>
    }) => {
      const res = await fetchClient<ApiData<CalendarEntry>>(
        `/api/calendar/${id}`,
        { method: 'PATCH', body: JSON.stringify(data) },
      )
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.calendar.all,
        exact: false,
      })
    },
  })
}

export function useDeleteCalendarEntry() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchClient<ApiData<{ success: boolean }>>(`/api/calendar/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.calendar.all,
        exact: false,
      })
    },
  })
}
