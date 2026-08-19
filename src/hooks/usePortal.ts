'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetch-client'
import type {
  PortalProjectData,
  PortalMilestoneData,
  PortalUpdateData,
  PortalFileData,
  PortalDocumentData,
  PortalTicketData,
  PortalTicketMessage,
} from '@/server/client-portal/portal.server'

type ApiData<T> = { data: T }

export function usePortalOverview(projectId: string) {
  return useQuery({
    queryKey: ['portal', projectId, 'overview'],
    queryFn: async () => {
      const res = await fetchClient<
        ApiData<{
          project: PortalProjectData
          milestones: PortalMilestoneData[]
        }>
      >(`/api/portal/${projectId}`)
      return res.data
    },
    enabled: !!projectId,
    staleTime: 30_000,
  })
}

export function usePortalUpdates(projectId: string) {
  return useQuery({
    queryKey: ['portal', projectId, 'updates'],
    queryFn: async () => {
      const res = await fetchClient<ApiData<PortalUpdateData[]>>(
        `/api/portal/${projectId}/updates`,
      )
      return res.data ?? []
    },
    enabled: !!projectId,
    staleTime: 30_000,
  })
}

export function usePortalFiles(projectId: string) {
  return useQuery({
    queryKey: ['portal', projectId, 'files'],
    queryFn: async () => {
      const res = await fetchClient<ApiData<PortalFileData[]>>(
        `/api/portal/${projectId}/files`,
      )
      return res.data ?? []
    },
    enabled: !!projectId,
    staleTime: 30_000,
  })
}

export function usePortalDocuments(projectId: string) {
  return useQuery({
    queryKey: ['portal', projectId, 'documents'],
    queryFn: async () => {
      const res = await fetchClient<ApiData<PortalDocumentData[]>>(
        `/api/portal/${projectId}/documents`,
      )
      return res.data ?? []
    },
    enabled: !!projectId,
    staleTime: 30_000,
  })
}

export function usePortalTickets(projectId: string) {
  return useQuery({
    queryKey: ['portal', projectId, 'tickets'],
    queryFn: async () => {
      const res = await fetchClient<ApiData<PortalTicketData[]>>(
        `/api/portal/${projectId}/tickets`,
      )
      return res.data ?? []
    },
    enabled: !!projectId,
    staleTime: 30_000,
  })
}

export function usePortalTicketMessages(
  projectId: string,
  ticketId: string | null,
) {
  return useQuery({
    queryKey: ['portal', projectId, 'tickets', ticketId, 'messages'],
    queryFn: async () => {
      const res = await fetchClient<ApiData<PortalTicketMessage[]>>(
        `/api/portal/${projectId}/tickets/${ticketId}`,
      )
      return res.data ?? []
    },
    enabled: !!projectId && !!ticketId,
    staleTime: 10_000,
  })
}

export function usePortalActions(projectId: string) {
  const queryClient = useQueryClient()

  const invalidate = (key: string) => {
    void queryClient.invalidateQueries({ queryKey: ['portal', projectId, key] })
  }

  const createTicket = useMutation({
    mutationFn: (input: {
      subject: string
      priority: string
      description: string
      attachments?: {
        name: string
        url: string
        size: number
        mimeType: string
      }[]
    }) =>
      fetchClient(`/api/portal/${projectId}/tickets`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidate('tickets'),
  })

  const replyToTicket = useMutation({
    mutationFn: ({
      ticketId,
      content,
      attachments,
    }: {
      ticketId: string
      content: string
      attachments?: {
        name: string
        url: string
        size: number
        mimeType: string
      }[]
    }) =>
      fetchClient(`/api/portal/${projectId}/tickets/${ticketId}`, {
        method: 'POST',
        body: JSON.stringify({ content, attachments }),
      }),
    onSuccess: (_, { ticketId }) => {
      void queryClient.invalidateQueries({
        queryKey: ['portal', projectId, 'tickets', ticketId],
      })
      invalidate('tickets')
    },
  })

  const markDocumentViewed = useMutation({
    mutationFn: (sendId: string) =>
      fetchClient(`/api/portal/${projectId}/documents`, {
        method: 'PATCH',
        body: JSON.stringify({ sendId }),
      }),
    onSuccess: () => invalidate('documents'),
  })

  const updateProfile = useMutation({
    mutationFn: (input: { full_name: string }) =>
      fetchClient('/api/portal/settings', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
    onSuccess: () => invalidate('overview'),
  })

  const changePassword = useMutation({
    mutationFn: (input: { currentPassword: string; newPassword: string }) =>
      fetchClient('/api/portal/settings?action=password', {
        method: 'PATCH',
        body: JSON.stringify(input),
      }),
  })

  const reopenTicket = useMutation({
    mutationFn: (ticketId: string) =>
      fetchClient(`/api/portal/${projectId}/tickets/${ticketId}/reopen`, {
        method: 'POST',
      }),
    onSuccess: () => invalidate('tickets'),
  })

  return {
    createTicket,
    replyToTicket,
    markDocumentViewed,
    updateProfile,
    changePassword,
    reopenTicket,
  }
}
