'use client'

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchClient } from '@/lib/api/fetch-client'
import { queryKeys } from '@/lib/query/keys'
import { ROUTES } from '@/constants/routes'
import { uploadVideoResumable } from '@/lib/videos/upload'
import { probeVideoDuration } from '@/lib/videos/probe'
import type { Video, VideoEditableFields } from '@/types/videos'

type ApiData<T> = { data: T }

export function useVideos() {
  return useQuery({
    queryKey: queryKeys.videos.list(),
    queryFn: async () => {
      const res = await fetchClient<ApiData<Video[]>>(ROUTES.API.VIDEOS)
      return res.data
    },
    refetchOnWindowFocus: true,
  })
}

export function useVideo(id: string | null) {
  return useQuery({
    queryKey: queryKeys.videos.detail(id ?? ''),
    enabled: Boolean(id),
    queryFn: async () => {
      const res = await fetchClient<ApiData<Video>>(ROUTES.API.VIDEO(id!))
      return res.data
    },
  })
}

export type CreateVideoInput = {
  title: string
  description?: string | null
  storage_path: string
  mime_type?: string | null
  file_size_bytes?: number | null
  duration_seconds?: number | null
  is_public?: boolean
}

export function useCreateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (body: CreateVideoInput) => {
      const res = await fetchClient<ApiData<Video>>(ROUTES.API.VIDEOS, {
        method: 'POST',
        body: JSON.stringify(body),
      })
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.videos.all })
    },
  })
}

export function useUpdateVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string
      data: VideoEditableFields
    }) => {
      const res = await fetchClient<ApiData<Video>>(ROUTES.API.VIDEO(id), {
        method: 'PATCH',
        body: JSON.stringify(data),
      })
      return res.data
    },
    onSuccess: (video) => {
      void qc.invalidateQueries({ queryKey: queryKeys.videos.all })
      void qc.invalidateQueries({
        queryKey: queryKeys.videos.detail(video.id),
      })
    },
  })
}

export function useSoftDeleteVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await fetchClient<ApiData<{ success: boolean }>>(ROUTES.API.VIDEO(id), {
        method: 'DELETE',
      })
      return id
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.videos.all })
    },
  })
}

export function useRestoreVideo() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const res = await fetchClient<ApiData<Video>>(
        ROUTES.API.VIDEO_RESTORE(id),
        { method: 'POST' },
      )
      return res.data
    },
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: queryKeys.videos.all })
    },
  })
}

export type UploadVideoInput = {
  file: File
  title: string
  description?: string
  is_public?: boolean
}

export type UploadPhase = 'idle' | 'uploading' | 'saving'

/**
 * Drives the resumable upload, then creates the metadata row. Progress is local
 * state rather than query cache since it's transient per-modal UI.
 */
export function useUploadVideo() {
  const createVideo = useCreateVideo()
  const [progress, setProgress] = useState(0)
  const [phase, setPhase] = useState<UploadPhase>('idle')

  const mutation = useMutation({
    mutationFn: async ({
      file,
      title,
      description,
      is_public,
    }: UploadVideoInput): Promise<Video> => {
      setPhase('uploading')
      setProgress(0)

      const [durationSeconds, storagePath] = await Promise.all([
        probeVideoDuration(file),
        uploadVideoResumable({ file, onProgress: setProgress }),
      ])

      setPhase('saving')

      return createVideo.mutateAsync({
        title,
        description: description?.trim() ? description.trim() : null,
        storage_path: storagePath,
        mime_type: file.type || null,
        file_size_bytes: file.size,
        duration_seconds: durationSeconds,
        is_public,
      })
    },
    onSettled: () => {
      setPhase('idle')
    },
  })

  return { ...mutation, progress, phase }
}
