'use client'

import {
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetch-client'
import { queryKeys } from '@/lib/query/keys'
import { ROUTES } from '@/constants/routes'
import type {
  Lead,
  LeadActivity,
  LeadAttachment,
  LeadFilters,
  LeadNote,
  LeadStage,
} from '@/types/leads'

type ApiData<T> = { data: T }

function cleanParams(
  filters?: LeadFilters,
): Record<string, string> | undefined {
  if (!filters) return undefined
  const params: Record<string, string> = {}
  if (filters.stage) params.stage = filters.stage
  if (filters.search) params.search = filters.search
  if (filters.assigned_to) params.assigned_to = filters.assigned_to
  if (filters.priority) params.priority = filters.priority
  if (filters.status) params.status = filters.status
  return Object.keys(params).length ? params : undefined
}

export function useLeads(filters?: LeadFilters) {
  return useQuery({
    queryKey: queryKeys.leads.list(filters as Record<string, string | undefined>),
    queryFn: async () => {
      const res = await fetchClient<ApiData<Lead[]>>(ROUTES.API.LEADS, {
        params: cleanParams(filters),
      })
      return res.data
    },
  })
}

export function useLead(id: string | null) {
  return useQuery({
    queryKey: queryKeys.leads.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetchClient<ApiData<Lead>>(ROUTES.API.LEAD(id!))
      return res.data
    },
  })
}

export function useCreateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetchClient<ApiData<Lead>>(ROUTES.API.LEADS, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })
}

export function useUpdateLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Record<string, unknown>
    }) => {
      const res = await fetchClient<ApiData<Lead>>(ROUTES.API.LEAD(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onMutate: async ({ id, data }) => {
      await qc.cancelQueries({ queryKey: queryKeys.leads.all })
      const previous = qc.getQueriesData<Lead[]>({
        queryKey: queryKeys.leads.all,
      })
      qc.setQueriesData<Lead[]>(
        { queryKey: queryKeys.leads.all },
        (old) =>
          old?.map((lead) =>
            lead.id === id ? ({ ...lead, ...data } as Lead) : lead,
          ),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous.forEach(([key, data]) => {
        qc.setQueryData(key, data)
      })
    },
    onSuccess: (lead) => {
      void qc.invalidateQueries({ queryKey: queryKeys.leads.all })
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.detail(lead.id),
      })
    },
  })
}

export function useUpdateLeadStage() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      newStage,
      oldStage,
    }: {
      id: string
      newStage: LeadStage
      oldStage: LeadStage
    }) => {
      const res = await fetchClient<ApiData<Lead>>(
        `${ROUTES.API.LEAD(id)}/stage`,
        {
          method: 'PATCH',
          body: JSON.stringify({ newStage, oldStage }),
        },
      )
      return res.data
    },
    onMutate: async ({ id, newStage }) => {
      await qc.cancelQueries({ queryKey: queryKeys.leads.all })
      const previous = qc.getQueriesData<Lead[]>({
        queryKey: queryKeys.leads.all,
      })
      qc.setQueriesData<Lead[]>(
        { queryKey: queryKeys.leads.all },
        (old) =>
          old?.map((lead) =>
            lead.id === id ? { ...lead, stage: newStage } : lead,
          ),
      )
      return { previous }
    },
    onError: (_err, _vars, ctx) => {
      ctx?.previous.forEach(([key, data]) => {
        qc.setQueryData(key, data)
      })
    },
    onSuccess: (lead) => {
      void qc.invalidateQueries({ queryKey: queryKeys.leads.all })
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.detail(lead.id),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.activity(lead.id),
      })
    },
  })
}

export function useDeleteLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchClient<ApiData<{ success: boolean }>>(ROUTES.API.LEAD(id), {
        method: 'DELETE',
      })
      return id
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.leads.all })
    },
  })
}

export function useAssignLead() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      assigned_to,
      assignee_name,
    }: {
      id: string
      assigned_to: string
      assignee_name: string
    }) => {
      const res = await fetchClient<ApiData<Lead>>(
        `${ROUTES.API.LEAD(id)}/assign`,
        {
          method: 'PATCH',
          body: JSON.stringify({ assigned_to, assignee_name }),
        },
      )
      return res.data
    },
    onSuccess: (lead) => {
      void qc.invalidateQueries({ queryKey: queryKeys.leads.all })
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.detail(lead.id),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.activity(lead.id),
      })
    },
  })
}

export function useLeadNotes(leadId: string | null) {
  return useQuery({
    queryKey: queryKeys.leads.notes(leadId ?? ''),
    enabled: Boolean(leadId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<LeadNote[]>>(
        `${ROUTES.API.LEAD(leadId!)}/notes`,
      )
      return res.data
    },
  })
}

export function useCreateLeadNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      leadId,
      content,
      note_type = 'note',
    }: {
      leadId: string
      content: string
      note_type?: string
    }) => {
      const res = await fetchClient<ApiData<LeadNote>>(
        `${ROUTES.API.LEAD(leadId)}/notes`,
        {
          method: 'POST',
          body: JSON.stringify({ content, note_type }),
        },
      )
      return res.data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.notes(vars.leadId),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.activity(vars.leadId),
      })
    },
  })
}

export function useDeleteLeadNote() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      leadId,
      noteId,
    }: {
      leadId: string
      noteId: string
    }) => {
      await fetchClient(`${ROUTES.API.LEAD(leadId)}/notes/${noteId}`, {
        method: 'DELETE',
      })
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.notes(vars.leadId),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.activity(vars.leadId),
      })
    },
  })
}

export function useLeadAttachments(leadId: string | null) {
  return useQuery({
    queryKey: queryKeys.leads.attachments(leadId ?? ''),
    enabled: Boolean(leadId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<LeadAttachment[]>>(
        `${ROUTES.API.LEAD(leadId!)}/attachments`,
      )
      return res.data
    },
  })
}

export function useCreateLeadAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      leadId,
      file_name,
      file_url,
      file_size,
      mime_type,
    }: {
      leadId: string
      file_name: string
      file_url: string
      file_size: number
      mime_type?: string | null
    }) => {
      const res = await fetchClient<ApiData<LeadAttachment>>(
        `${ROUTES.API.LEAD(leadId)}/attachments`,
        {
          method: 'POST',
          body: JSON.stringify({ file_name, file_url, file_size, mime_type }),
        },
      )
      return res.data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.attachments(vars.leadId),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.activity(vars.leadId),
      })
    },
  })
}

export function useDeleteLeadAttachment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      leadId,
      attachmentId,
    }: {
      leadId: string
      attachmentId: string
    }) => {
      await fetchClient(
        `${ROUTES.API.LEAD(leadId)}/attachments/${attachmentId}`,
        { method: 'DELETE' },
      )
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.attachments(vars.leadId),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.activity(vars.leadId),
      })
    },
  })
}

export function useLeadActivity(leadId: string | null) {
  return useQuery({
    queryKey: queryKeys.leads.activity(leadId ?? ''),
    enabled: Boolean(leadId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<LeadActivity[]>>(
        `${ROUTES.API.LEAD(leadId!)}/activity`,
      )
      return res.data
    },
  })
}
