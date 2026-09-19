'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetch-client'
import { queryKeys } from '@/lib/query/keys'
import { ROUTES } from '@/constants/routes'
import type {
  BlogCategory,
  BlogComment,
  BlogCommentStatus,
  BlogFilters,
  BlogPost,
} from '@/types/blog'

type ApiData<T> = { data: T }

export function useBlogPosts(filters?: BlogFilters) {
  const params = new URLSearchParams()
  if (filters?.search) params.set('search', filters.search)
  if (filters?.status && filters.status !== 'all') {
    params.set('status', filters.status)
  }
  if (filters?.category_id) params.set('category_id', filters.category_id)
  if (filters?.author_id) params.set('author_id', filters.author_id)
  const qs = params.toString()

  return useQuery({
    queryKey: queryKeys.blog.list(filters ?? {}),
    queryFn: async () => {
      const res = await fetchClient<ApiData<BlogPost[]>>(
        `${ROUTES.API.BLOG}${qs ? `?${qs}` : ''}`,
      )
      return res.data
    },
    refetchOnWindowFocus: true,
  })
}

export function useBlogPost(id: string | null) {
  return useQuery({
    queryKey: queryKeys.blog.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetchClient<ApiData<BlogPost>>(
        ROUTES.API.BLOG_POST(id!),
      )
      return res.data
    },
  })
}

export function useCreateBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: Record<string, unknown>) => {
      const res = await fetchClient<ApiData<BlogPost>>(ROUTES.API.BLOG, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.blog.all,
        exact: false,
      })
    },
  })
}

export function useUpdateBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: Record<string, unknown>
    }) => {
      const res = await fetchClient<ApiData<BlogPost>>(
        ROUTES.API.BLOG_POST(id),
        {
          method: 'PATCH',
          body: JSON.stringify(data),
        },
      )
      return res.data
    },
    onSuccess: (post) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.blog.all,
        exact: false,
      })
      void qc.invalidateQueries({
        queryKey: queryKeys.blog.detail(post.id),
      })
    },
  })
}

export function useDeleteBlogPost() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchClient<ApiData<{ success: boolean }>>(
        ROUTES.API.BLOG_POST(id),
        { method: 'DELETE' },
      )
    },
    onSuccess: () => {
      void qc.invalidateQueries({
        queryKey: queryKeys.blog.all,
        exact: false,
      })
    },
  })
}

export function useBlogCategories() {
  return useQuery({
    queryKey: queryKeys.blog.categories,
    queryFn: async () => {
      const res = await fetchClient<ApiData<BlogCategory[]>>(
        `${ROUTES.API.BLOG}/categories`,
      )
      return res.data
    },
  })
}

export function useCreateBlogCategory() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: { name: string; description?: string }) => {
      const res = await fetchClient<ApiData<BlogCategory>>(
        `${ROUTES.API.BLOG}/categories`,
        { method: 'POST', body: JSON.stringify(body) },
      )
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.blog.categories })
    },
  })
}

export function useBlogComments(postId: string | null) {
  return useQuery({
    queryKey: queryKeys.blog.comments(postId ?? ''),
    enabled: Boolean(postId),
    queryFn: async () => {
      const res = await fetchClient<ApiData<BlogComment[]>>(
        `${ROUTES.API.BLOG_POST(postId!)}/comments`,
      )
      return res.data
    },
  })
}

export function useModerateComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      postId,
      commentId,
      status,
      rejection_reason,
    }: {
      postId: string
      commentId: string
      status: BlogCommentStatus
      rejection_reason?: string | null
    }) => {
      const res = await fetchClient<ApiData<BlogComment>>(
        `${ROUTES.API.BLOG_POST(postId)}/comments/${commentId}`,
        {
          method: 'PATCH',
          body: JSON.stringify({ status, rejection_reason }),
        },
      )
      return res.data
    },
    onSuccess: (_data, { postId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.blog.comments(postId),
      })
    },
  })
}

export function useDeleteBlogComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      postId,
      commentId,
    }: {
      postId: string
      commentId: string
    }) => {
      await fetchClient<ApiData<{ success: boolean }>>(
        `${ROUTES.API.BLOG_POST(postId)}/comments/${commentId}`,
        { method: 'DELETE' },
      )
    },
    onSuccess: (_data, { postId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.blog.comments(postId),
      })
    },
  })
}

export function useReplyToBlogComment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      postId,
      commentId,
      content,
    }: {
      postId: string
      commentId: string
      content: string
    }) => {
      const res = await fetchClient<
        ApiData<{ success: boolean; reply_id: string; data: BlogComment }>
      >(`${ROUTES.API.BLOG_POST(postId)}/comments/${commentId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      })
      return res.data
    },
    onSuccess: (_data, { postId }) => {
      void qc.invalidateQueries({
        queryKey: queryKeys.blog.comments(postId),
      })
    },
  })
}
