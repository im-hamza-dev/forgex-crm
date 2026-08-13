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
  ClientTicket,
  Project,
  ProjectFeedUpdate,
  ProjectFile,
  ProjectMilestone,
  ProjectTaskRow,
  TicketMessage,
} from '@/types/projects'

type ApiData<T> = { data: T }

function projectPath(id: string, suffix = '') {
  return `${ROUTES.API.PROJECT(id)}${suffix}`
}

export function useProjects() {
  return useQuery({
    queryKey: queryKeys.projects.list(),
    queryFn: async () => {
      const res = await fetchClient<ApiData<Project[]>>(ROUTES.API.PROJECTS)
      return res.data
    },
  })
}

export function useProject(id: string | null) {
  return useQuery({
    queryKey: queryKeys.projects.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetchClient<ApiData<Project>>(
        ROUTES.API.PROJECT(id!),
      )
      return res.data
    },
  })
}

export function useCreateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetchClient<ApiData<Project>>(ROUTES.API.PROJECTS, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.list(),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.all,
      })
      // Invalidate all leads queries regardless of filters
      void qc.invalidateQueries({
        queryKey: queryKeys.leads.all,
        exact: false,
      })
    },
  })
}

export function useUpdateProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Record<string, unknown>
    }) => {
      const res = await fetchClient<ApiData<Project>>(ROUTES.API.PROJECT(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: (project) => {
      void qc.invalidateQueries({ queryKey: queryKeys.projects.all })
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.detail(project.id),
      })
    },
  })
}

export function useDeleteProject() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchClient<ApiData<{ success: boolean }>>(
        ROUTES.API.PROJECT(id),
        { method: 'DELETE' },
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.projects.all })
    },
  })
}

export function useProjectMilestones(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.milestones(projectId),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<ProjectMilestone[]>>(
        projectPath(projectId, '/milestones'),
      )
      return res.data
    },
  })
}

export function useCreateMilestone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      ...body
    }: {
      projectId: string
      title: string
      description?: string
      due_date?: string
    }) => {
      const res = await fetchClient<ApiData<ProjectMilestone>>(
        projectPath(projectId, '/milestones'),
        { method: 'POST', body: JSON.stringify(body) },
      )
      return res.data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.milestones(vars.projectId),
      })
    },
  })
}

export function useCompleteMilestone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      milestoneId,
    }: {
      projectId: string
      milestoneId: string
    }) => {
      const res = await fetchClient<ApiData<ProjectMilestone>>(
        projectPath(projectId, `/milestones/${milestoneId}`),
        { method: 'PATCH' },
      )
      return res.data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.milestones(vars.projectId),
      })
    },
  })
}

export function useDeleteMilestone() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      milestoneId,
    }: {
      projectId: string
      milestoneId: string
    }) => {
      await fetchClient<ApiData<{ success: boolean }>>(
        projectPath(projectId, `/milestones/${milestoneId}`),
        { method: 'DELETE' },
      )
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.milestones(vars.projectId),
      })
    },
  })
}

export function useProjectUpdates(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.updates(projectId),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<ProjectFeedUpdate[]>>(
        projectPath(projectId, '/updates'),
      )
      return res.data
    },
  })
}

export function useCreateProjectUpdate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      content,
      is_client_visible,
    }: {
      projectId: string
      content: string
      is_client_visible?: boolean
    }) => {
      const res = await fetchClient<ApiData<ProjectFeedUpdate>>(
        projectPath(projectId, '/updates'),
        {
          method: 'POST',
          body: JSON.stringify({ content, is_client_visible }),
        },
      )
      return res.data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.updates(vars.projectId),
      })
    },
  })
}

export function useToggleUpdateVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      updateId,
      is_client_visible,
    }: {
      projectId: string
      updateId: string
      is_client_visible: boolean
    }) => {
      const res = await fetchClient<ApiData<ProjectFeedUpdate>>(
        projectPath(projectId, `/updates/${updateId}`),
        {
          method: 'PATCH',
          body: JSON.stringify({ is_client_visible }),
        },
      )
      return res.data
    },
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.updates(projectId),
      })
    },
  })
}

export function useDeleteProjectUpdate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      updateId,
    }: {
      projectId: string
      updateId: string
    }) => {
      await fetchClient<ApiData<{ success: boolean }>>(
        projectPath(projectId, `/updates/${updateId}`),
        { method: 'DELETE' },
      )
    },
    onSuccess: (_data, { projectId, updateId }) => {
      qc.setQueryData<ProjectFeedUpdate[]>(
        queryKeys.projects.updates(projectId),
        (old) => old?.filter((u) => u.id !== updateId),
      )
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.updates(projectId),
      })
    },
  })
}

export function useProjectFiles(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.files(projectId),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<ProjectFile[]>>(
        projectPath(projectId, '/files'),
      )
      return res.data
    },
  })
}

export function useCreateProjectFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      ...body
    }: {
      projectId: string
      file_name: string
      file_url: string
      file_size?: number
      mime_type?: string | null
      is_client_visible?: boolean
    }) => {
      const res = await fetchClient<ApiData<ProjectFile>>(
        projectPath(projectId, '/files'),
        { method: 'POST', body: JSON.stringify(body) },
      )
      return res.data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.files(vars.projectId),
      })
    },
  })
}

export function useToggleFileVisibility() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      fileId,
      is_client_visible,
    }: {
      projectId: string
      fileId: string
      is_client_visible: boolean
    }) => {
      const res = await fetchClient<ApiData<ProjectFile>>(
        projectPath(projectId, `/files/${fileId}`),
        {
          method: 'PATCH',
          body: JSON.stringify({ is_client_visible }),
        },
      )
      return res.data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.files(vars.projectId),
      })
    },
  })
}

export function useDeleteProjectFile() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      fileId,
    }: {
      projectId: string
      fileId: string
    }) => {
      await fetchClient<ApiData<{ success: boolean }>>(
        projectPath(projectId, `/files/${fileId}`),
        { method: 'DELETE' },
      )
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.files(vars.projectId),
      })
    },
  })
}

export function useProjectTickets(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.tickets(projectId),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<ClientTicket[]>>(
        projectPath(projectId, '/tickets'),
      )
      return res.data
    },
  })
}

export function useTicketMessages(
  projectId: string,
  ticketId: string | null,
) {
  return useQuery({
    queryKey: queryKeys.projects.ticketMessages(ticketId ?? ''),
    enabled: Boolean(projectId && ticketId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<TicketMessage[]>>(
        projectPath(projectId, `/tickets/${ticketId}`),
      )
      return res.data
    },
  })
}

export function useReplyToTicket() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      ticketId,
      content,
    }: {
      projectId: string
      ticketId: string
      content: string
    }) => {
      const res = await fetchClient<ApiData<TicketMessage>>(
        projectPath(projectId, `/tickets/${ticketId}`),
        { method: 'POST', body: JSON.stringify({ content }) },
      )
      return res.data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.ticketMessages(vars.ticketId),
      })
    },
  })
}

export function useUpdateTicketStatus() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      ticketId,
      status,
    }: {
      projectId: string
      ticketId: string
      status: 'open' | 'in_progress' | 'resolved' | 'closed'
    }) => {
      const res = await fetchClient<ApiData<ClientTicket>>(
        projectPath(projectId, `/tickets/${ticketId}`),
        { method: 'PATCH', body: JSON.stringify({ status }) },
      )
      return res.data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.tickets(vars.projectId),
      })
    },
  })
}

export function useInviteClient() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      ...body
    }: {
      projectId: string
      email: string
      full_name: string
      company?: string
    }) => {
      const res = await fetchClient<ApiData<unknown>>(
        projectPath(projectId, '/invite-client'),
        { method: 'POST', body: JSON.stringify(body) },
      )
      return res.data
    },
    onSuccess: (_data, vars) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.detail(vars.projectId),
      })
    },
  })
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.projects.tasks(projectId),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<ProjectTaskRow[]>>(
        projectPath(projectId, '/tasks'),
      )
      return res.data
    },
  })
}
