'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetch-client'
import type { TeamMember, PendingInvite } from '@/server/team/team.server'

type ApiData<T> = { data: T }

const QUERY_KEY = {
  members: ['team', 'members'] as const,
  pending: ['team', 'pending'] as const,
}

export function useTeamMembers() {
  return useQuery({
    queryKey: QUERY_KEY.members,
    queryFn: async () => {
      const res = await fetchClient<ApiData<TeamMember[]>>('/api/team')
      return res.data ?? []
    },
    staleTime: 30_000,
  })
}

export function usePendingInvites() {
  return useQuery({
    queryKey: QUERY_KEY.pending,
    queryFn: async () => {
      const res = await fetchClient<ApiData<PendingInvite[]>>(
        '/api/team?view=pending',
      )
      return res.data ?? []
    },
    staleTime: 30_000,
  })
}

export function useTeamActions() {
  const queryClient = useQueryClient()

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['team'] })
  }

  const updateRole = useMutation({
    mutationFn: ({ id, role }: { id: string; role: 'manager' | 'member' }) =>
      fetchClient(`/api/team/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'update_role', role }),
      }),
    onSuccess: () => invalidate(),
  })

  const deactivate = useMutation({
    mutationFn: (id: string) =>
      fetchClient(`/api/team/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'deactivate' }),
      }),
    onSuccess: () => invalidate(),
  })

  const reactivate = useMutation({
    mutationFn: (id: string) =>
      fetchClient(`/api/team/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'reactivate' }),
      }),
    onSuccess: () => invalidate(),
  })

  const cancelInvite = useMutation({
    mutationFn: (id: string) =>
      fetchClient(`/api/team/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ action: 'cancel_invite' }),
      }),
    onSuccess: () => invalidate(),
  })

  return { updateRole, deactivate, reactivate, cancelInvite }
}
