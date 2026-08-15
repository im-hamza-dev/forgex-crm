'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetch-client'
import { queryKeys } from '@/lib/query/keys'
import type {
  ClientAccountOption,
  ClientDocument,
  ClientDocumentSend,
  InternalDoc,
} from '@/types/docs'

type ApiData<T> = { data: T }

export function useInternalDocs(filters?: {
  category?: string
  search?: string
  my_only?: boolean
}) {
  const params = new URLSearchParams()
  if (filters?.category) params.set('category', filters.category)
  if (filters?.search) params.set('search', filters.search)
  if (filters?.my_only) params.set('my_only', 'true')
  const qs = params.toString()

  return useQuery({
    queryKey: queryKeys.docs.internalList(filters ?? {}),
    queryFn: async () => {
      const res = await fetchClient<ApiData<InternalDoc[]>>(
        `/api/docs/internal${qs ? `?${qs}` : ''}`,
      )
      return res.data
    },
    refetchOnWindowFocus: true,
  })
}

export function useInternalDoc(id: string | null) {
  return useQuery({
    queryKey: queryKeys.docs.internalDetail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetchClient<ApiData<InternalDoc>>(
        `/api/docs/internal/${id}`,
      )
      return res.data
    },
  })
}

export function useCreateInternalDoc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetchClient<ApiData<InternalDoc>>('/api/docs/internal', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.docs.all,
        exact: false,
      })
    },
  })
}

export function useUpdateInternalDoc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Record<string, unknown>
    }) => {
      const res = await fetchClient<ApiData<InternalDoc>>(
        `/api/docs/internal/${id}`,
        { method: 'PATCH', body: JSON.stringify(data) },
      )
      return res.data
    },
    onSuccess: (doc) => {
      void qc.invalidateQueries({ queryKey: queryKeys.docs.all, exact: false })
      void qc.invalidateQueries({
        queryKey: queryKeys.docs.internalDetail(doc.id),
      })
    },
  })
}

export function useDeleteInternalDoc() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchClient<ApiData<{ success: boolean }>>(
        `/api/docs/internal/${id}`,
        { method: 'DELETE' },
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.docs.all, exact: false })
    },
  })
}

export function useClientDocuments(enabled = true) {
  return useQuery({
    queryKey: queryKeys.docs.clientList(),
    enabled,
    queryFn: async () => {
      const res = await fetchClient<ApiData<ClientDocument[]>>(
        '/api/docs/client',
      )
      return res.data
    },
  })
}

export function useClientDocument(id: string | null) {
  return useQuery({
    queryKey: queryKeys.docs.clientDetail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetchClient<ApiData<ClientDocument>>(
        `/api/docs/client/${id}`,
      )
      return res.data
    },
  })
}

export function useCreateClientDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetchClient<ApiData<ClientDocument>>(
        '/api/docs/client',
        { method: 'POST', body: JSON.stringify(body) },
      )
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.docs.clientList(),
      })
    },
  })
}

export function useUpdateClientDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Record<string, unknown>
    }) => {
      const res = await fetchClient<ApiData<ClientDocument>>(
        `/api/docs/client/${id}`,
        { method: 'PATCH', body: JSON.stringify(data) },
      )
      return res.data
    },
    onSuccess: (doc) => {
      void qc.invalidateQueries({ queryKey: queryKeys.docs.clientList() })
      void qc.invalidateQueries({
        queryKey: queryKeys.docs.clientDetail(doc.id),
      })
    },
  })
}

export function useDeleteClientDocument() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchClient<ApiData<{ success: boolean }>>(
        `/api/docs/client/${id}`,
        { method: 'DELETE' },
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.docs.clientList() })
    },
  })
}

export function useSendDocumentToClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      documentId,
      clientAccountIds,
    }: {
      documentId: string
      clientAccountIds: string[]
    }) => {
      const res = await fetchClient<ApiData<ClientDocumentSend[]>>(
        `/api/docs/client/${documentId}/send`,
        {
          method: 'POST',
          body: JSON.stringify({ client_account_ids: clientAccountIds }),
        },
      )
      return res.data
    },
    onSuccess: (_data, { documentId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.docs.clientDetail(documentId),
      })
    },
  })
}

export function useClientAccountsForDocs() {
  return useQuery({
    queryKey: queryKeys.docs.clientAccounts(),
    queryFn: async () => {
      const res = await fetchClient<ApiData<ClientAccountOption[]>>(
        '/api/docs/client-accounts',
      )
      return res.data
    },
  })
}
