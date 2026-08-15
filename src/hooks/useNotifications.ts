'use client'

import { useEffect } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetch-client'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import type { Notification } from '@/types/notifications'

type ApiData<T> = { data: T }

const QUERY_KEY = {
  all: ['notifications'] as const,
  list: () => [...QUERY_KEY.all, 'list'] as const,
  count: () => [...QUERY_KEY.all, 'count'] as const,
}

async function fetchNotifications(): Promise<Notification[]> {
  const res = await fetchClient<ApiData<Notification[]>>(
    '/api/notifications?limit=50',
  )
  return res.data ?? []
}

async function fetchUnreadCount(): Promise<number> {
  const res = await fetchClient<ApiData<{ count: number }>>(
    '/api/notifications?action=unread_count',
  )
  return res.data?.count ?? 0
}

export function useNotifications() {
  const { profile } = useAuth()
  const queryClient = useQueryClient()

  const listQuery = useQuery({
    queryKey: QUERY_KEY.list(),
    queryFn: fetchNotifications,
    staleTime: 30_000,
    enabled: !!profile?.id,
  })

  const countQuery = useQuery({
    queryKey: QUERY_KEY.count(),
    queryFn: fetchUnreadCount,
    staleTime: 30_000,
    enabled: !!profile?.id,
  })

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: QUERY_KEY.all })
  }

  useEffect(() => {
    if (!profile?.id) return

    const supabase = createClient()

    const channelName = `notifications:${profile.id}:${Math.random().toString(36).slice(2)}`

    const handleChange = () => {
      void queryClient.invalidateQueries({ queryKey: ['notifications'] })
    }

    supabase.getChannels().forEach((ch) => {
      if (ch.topic.startsWith(`realtime:notifications:${profile.id}`)) {
        void supabase.removeChannel(ch)
      }
    })

    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        handleChange,
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${profile.id}`,
        },
        handleChange,
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('[useNotifications] Realtime channel error:', channelName)
        }
      })

    return () => {
      void supabase.removeChannel(channel)
    }
  }, [profile?.id, queryClient])

  const markAsRead = useMutation({
    mutationFn: (id: string) =>
      fetchClient(`/api/notifications?action=read&id=${id}`, {
        method: 'PATCH',
      }),
    onSuccess: () => invalidate(),
  })

  const markAllAsRead = useMutation({
    mutationFn: () =>
      fetchClient('/api/notifications?action=mark_all_read', {
        method: 'PATCH',
      }),
    onSuccess: () => invalidate(),
  })

  const dismiss = useMutation({
    mutationFn: (id: string) =>
      fetchClient(`/api/notifications?action=dismiss&id=${id}`, {
        method: 'PATCH',
      }),
    onSuccess: () => invalidate(),
  })

  const dismissAll = useMutation({
    mutationFn: () =>
      fetchClient('/api/notifications?action=dismiss_all', {
        method: 'PATCH',
      }),
    onSuccess: () => invalidate(),
  })

  return {
    notifications: listQuery.data ?? [],
    unreadCount: countQuery.data ?? 0,
    isLoading: listQuery.isLoading,
    markAsRead: (id: string) => markAsRead.mutate(id),
    markAllAsRead: () => markAllAsRead.mutate(),
    dismiss: (id: string) => dismiss.mutate(id),
    dismissAll: () => dismissAll.mutate(),
    refetch: invalidate,
  }
}
