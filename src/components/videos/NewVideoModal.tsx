'use client'

import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Check, Copy, FileVideo, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Textarea, toast } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import {
  VIDEO_ACCEPT_ATTR,
  VIDEO_MAX_BYTES,
  VIDEO_MAX_MB,
  isAllowedVideoMime,
} from '@/constants/videos'
import { formatFileSize } from '@/lib/videos/format'
import { useUploadVideo } from '@/hooks/useVideos'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
})

type FormValues = z.infer<typeof schema>

/** Mounted only while open, so a fresh instance is the state reset. */
interface NewVideoModalProps {
  onClose: () => void
}

function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode
  required?: boolean
}) {
  return (
    <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
      {children}
      {required && <span className="text-[var(--color-accent)]"> *</span>}
    </label>
  )
}

function ProgressBar({ percent }: { percent: number }) {
  return (
    <div
      className="h-2 w-full rounded-full overflow-hidden bg-[var(--color-surface-hover)]"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className="h-full rounded-full bg-[var(--color-accent)] transition-[width] duration-200"
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}

export function NewVideoModal({ onClose }: NewVideoModalProps) {
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState<string | null>(null)
  const [createdSlug, setCreatedSlug] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const upload = useUploadVideo()
  const busy = upload.isPending

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { title: '', description: '' },
  })

  const handleClose = () => {
    if (busy) return
    onClose()
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0] ?? null
    setFileError(null)

    if (!picked) {
      setFile(null)
      return
    }

    const mime = picked.type
    if (!mime.startsWith('video/') || !isAllowedVideoMime(mime)) {
      setFile(null)
      setFileError('Choose an MP4, WebM, MOV or AVI video file')
      return
    }
    if (picked.size > VIDEO_MAX_BYTES) {
      setFile(null)
      setFileError(
        `That file is ${formatFileSize(picked.size)}. The limit is ${VIDEO_MAX_MB} MB.`,
      )
      return
    }

    setFile(picked)
    // Seed the title from the filename so the common case is one click.
    setValue('title', picked.name.replace(/\.[^.]+$/, ''), {
      shouldValidate: true,
    })
  }

  const onFormSubmit = async (values: FormValues) => {
    if (!file) {
      setFileError('Select a video file to upload')
      return
    }

    try {
      const video = await upload.mutateAsync({
        file,
        title: values.title.trim(),
        description: values.description,
      })
      setCreatedSlug(video.slug)
      toast.success('Video uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    }
  }

  const publicUrl = createdSlug
    ? `${window.location.origin}${ROUTES.VIDEO_PUBLIC(createdSlug)}`
    : null

  const handleCopy = async () => {
    if (!publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopied(true)
      toast.success('Link copied')
    } catch {
      toast.error('Could not copy the link')
    }
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[var(--color-overlay)]"
        onClick={handleClose}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-[560px]',
          'bg-[var(--color-surface)] rounded-2xl',
          'shadow-[0_16px_48px_rgba(26,16,8,0.16)]',
          'max-h-[90vh] flex flex-col',
        )}
      >
        <div className="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] shrink-0">
          <h2 className="text-[18px] font-bold text-[var(--color-text-heading)]">
            {createdSlug ? 'Video ready to share' : 'New Video'}
          </h2>
          <button
            type="button"
            onClick={handleClose}
            disabled={busy}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg',
              'text-[var(--color-text-muted)] transition-colors',
              'hover:bg-[var(--color-surface-hover)]',
              'disabled:opacity-40',
            )}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        {createdSlug ? (
          <div className="flex-1 overflow-y-auto px-6 py-5">
            <div className="flex flex-col gap-4">
              <p className="text-[13px] text-[var(--color-text-secondary)]">
                Anyone with this link can watch the video while it stays public.
                Making it private later kills the link immediately.
              </p>
              <div className="flex items-center gap-2">
                <input
                  readOnly
                  value={publicUrl ?? ''}
                  onFocus={(e) => e.currentTarget.select()}
                  className={cn(
                    'flex-1 h-[40px] px-3 rounded-lg text-[13px] font-mono',
                    'border border-[var(--color-border)] outline-none',
                    'bg-[var(--color-page)] text-[var(--color-text-body)]',
                  )}
                />
                <Button
                  variant="outline"
                  size="md"
                  icon={copied ? <Check size={14} /> : <Copy size={14} />}
                  onClick={() => void handleCopy()}
                >
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <form
            id="new-video-form"
            onSubmit={handleSubmit(onFormSubmit)}
            className={cn(
              'flex-1 overflow-y-auto px-6 py-5',
              busy && 'opacity-60 pointer-events-none',
            )}
          >
            <div className="flex flex-col gap-4">
              <div>
                <FieldLabel required>Video File</FieldLabel>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={VIDEO_ACCEPT_ATTR}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-4 rounded-lg text-left',
                    'border border-dashed transition-colors',
                    'hover:bg-[var(--color-surface-hover)]',
                    fileError
                      ? 'border-[var(--color-danger)]'
                      : 'border-[var(--color-border-strong)]',
                  )}
                >
                  <FileVideo
                    size={20}
                    className="shrink-0 text-[var(--color-accent)]"
                  />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-medium text-[var(--color-text-heading)] truncate">
                      {file ? file.name : 'Choose a video file'}
                    </span>
                    <span className="block text-[11px] text-[var(--color-text-muted)]">
                      {file
                        ? formatFileSize(file.size)
                        : `MP4, WebM, MOV or AVI · up to ${VIDEO_MAX_MB} MB`}
                    </span>
                  </span>
                </button>
                {fileError && (
                  <p className="mt-1.5 text-[11px] text-[var(--color-danger)]">
                    {fileError}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel required>Title</FieldLabel>
                <input
                  {...register('title')}
                  className={cn(
                    'w-full h-[40px] px-3 rounded-lg text-[13px]',
                    'border outline-none transition-colors',
                    'bg-[var(--color-surface)] text-[var(--color-text-body)]',
                    'placeholder:text-[var(--color-text-muted)]',
                    errors.title
                      ? 'border-[var(--color-danger)]'
                      : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
                  )}
                  placeholder="Q3 product walkthrough"
                />
                {errors.title && (
                  <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                    {errors.title.message}
                  </p>
                )}
              </div>

              <div>
                <FieldLabel>Description</FieldLabel>
                <Textarea
                  {...register('description')}
                  error={errors.description?.message}
                  placeholder="What's in this clip?"
                  hint="Shown under the player and in link previews."
                />
              </div>

              <p className="text-[12px] text-[var(--color-text-muted)]">
                New videos are public as soon as they finish uploading. You can
                make it private at any time.
              </p>
            </div>
          </form>
        )}

        <div className="flex items-center justify-between gap-4 px-6 py-4 border-t border-[var(--color-border)] shrink-0">
          {createdSlug ? (
            <>
              <span />
              <Button variant="primary" size="md" onClick={onClose}>
                Done
              </Button>
            </>
          ) : busy ? (
            <div className="flex-1 flex items-center gap-3">
              <div className="flex-1">
                <ProgressBar percent={upload.progress} />
              </div>
              <span className="text-[12px] tabular-nums text-[var(--color-text-secondary)] w-[110px] text-right">
                {upload.phase === 'saving'
                  ? 'Finishing up…'
                  : `Uploading ${upload.progress}%`}
              </span>
            </div>
          ) : (
            <>
              <Button variant="ghost" size="md" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                type="submit"
                form="new-video-form"
                disabled={!file}
              >
                Upload Video
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
