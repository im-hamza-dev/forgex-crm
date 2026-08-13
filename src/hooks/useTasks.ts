'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetch-client'
import { queryKeys } from '@/lib/query/keys'
import type { Task, TaskComment, TaskFilters } from '@/types/tasks'

type ApiData<T> = { data: T }

export function useTasks(filters?: TaskFilters) {
  const params = new URLSearchParams()
  if (filters?.search) params.set('search', filters.search)
  if (filters?.status) params.set('status', filters.status)
  if (filters?.priority) params.set('priority', filters.priority)
  if (filters?.project_id) params.set('project_id', filters.project_id)
  if (filters?.assigned_to) params.set('assigned_to', filters.assigned_to)
  if (filters?.due) params.set('due', filters.due)

  const qs = params.toString()

  return useQuery({
    queryKey: queryKeys.tasks.list(filters ?? {}),
    queryFn: async () => {
      const res = await fetchClient<ApiData<Task[]>>(
        `/api/tasks${qs ? `?${qs}` : ''}`,
      )
      return res.data
    },
    refetchOnWindowFocus: true,
  })
}

export function useTask(id: string | null) {
  return useQuery({
    queryKey: queryKeys.tasks.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetchClient<
        ApiData<Task & { subtasks?: Task[] }>
      >(`/api/tasks/${id}`)
      return res.data
    },
  })
}

export function useCreateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetchClient<ApiData<Task>>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.tasks.all,
        exact: false,
      })
    },
  })
}

export function useUpdateTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Record<string, unknown>
    }) => {
      const res = await fetchClient<ApiData<Task>>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: (task) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.tasks.all,
        exact: false,
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.tasks.detail(task.id),
      })
    },
  })
}

export function useDeleteTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchClient<ApiData<{ success: boolean }>>(`/api/tasks/${id}`, {
        method: 'DELETE',
      })
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.tasks.all,
        exact: false,
      })
    },
  })
}

export function useTaskComments(taskId: string | null) {
  return useQuery({
    queryKey: queryKeys.tasks.comments(taskId ?? ''),
    enabled: Boolean(taskId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<TaskComment[]>>(
        `/api/tasks/${taskId}/comments`,
      )
      return res.data
    },
  })
}

export function useCreateTaskComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      taskId,
      content,
    }: {
      taskId: string
      content: string
    }) => {
      const res = await fetchClient<ApiData<TaskComment>>(
        `/api/tasks/${taskId}/comments`,
        { method: 'POST', body: JSON.stringify({ content }) },
      )
      return res.data
    },
    onSuccess: (_data, { taskId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.tasks.comments(taskId),
      })
    },
  })
}

export function useDeleteTaskComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      taskId,
      commentId,
    }: {
      taskId: string
      commentId: string
    }) => {
      await fetchClient<ApiData<{ success: boolean }>>(
        `/api/tasks/${taskId}/comments/${commentId}`,
        { method: 'DELETE' },
      )
    },
    onSuccess: (_data, { taskId, commentId }) => {
      qc.setQueryData<TaskComment[]>(
        queryKeys.tasks.comments(taskId),
        (old) => old?.filter((c) => c.id !== commentId),
      )
      void qc.invalidateQueries({
        queryKey: queryKeys.tasks.comments(taskId),
      })
    },
  })
}

export function useProjectTasks(projectId: string) {
  return useQuery({
    queryKey: queryKeys.tasks.byProject(projectId),
    enabled: Boolean(projectId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<Task[]>>(
        `/api/projects/${projectId}/tasks`,
      )
      return res.data
    },
  })
}

export function useCreateProjectTask() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      projectId,
      ...body
    }: {
      projectId: string
      title: string
      description?: string
      milestone_id?: string
      assigned_to?: string
      priority?: string
      status?: string
      due_date?: string
      estimated_hours?: number
    }) => {
      const res = await fetchClient<ApiData<Task>>(
        `/api/projects/${projectId}/tasks`,
        { method: 'POST', body: JSON.stringify(body) },
      )
      return res.data
    },
    onSuccess: (_data, { projectId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.tasks.byProject(projectId),
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.tasks.all,
        exact: false,
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.projects.tasks(projectId),
      })
    },
  })
}
