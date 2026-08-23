'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Info, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, SegmentedControl, Textarea } from '@/components/ui'
import type { Video, VideoEditableFields } from '@/types/videos'

const schema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(2000, 'Description is too long').optional(),
})

type FormValues = z.infer<typeof schema>

/** Mounted only while editing, so the form seeds from `video` on mount. */
interface EditVideoModalProps {
  video: Video
  loading?: boolean
  onClose: () => void
  onSubmit: (data: VideoEditableFields) => void
}

export function EditVideoModal({
  video,
  loading = false,
  onClose,
  onSubmit,
}: EditVideoModalProps) {
  const [visibility, setVisibility] = useState(
    video.is_public ? 'public' : 'private',
  )

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: video.title,
      description: video.description ?? '',
    },
  })

  const handleClose = () => {
    if (loading) return
    onClose()
  }

  const onFormSubmit = (values: FormValues) => {
    onSubmit({
      title: values.title.trim(),
      description: values.description?.trim() ? values.description.trim() : null,
      is_public: visibility === 'public',
    })
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
            Edit Video
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'flex items-center justify-center w-8 h-8 rounded-lg',
              'text-[var(--color-text-muted)] transition-colors',
              'hover:bg-[var(--color-surface-hover)]',
            )}
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>

        <form
          id="edit-video-form"
          onSubmit={handleSubmit(onFormSubmit)}
          className={cn(
            'flex-1 overflow-y-auto px-6 py-5',
            loading && 'opacity-60 pointer-events-none',
          )}
        >
          <div className="flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                Title
                <span className="text-[var(--color-accent)]"> *</span>
              </label>
              <input
                {...register('title')}
                className={cn(
                  'w-full h-[40px] px-3 rounded-lg text-[13px]',
                  'border outline-none transition-colors',
                  'bg-[var(--color-surface)] text-[var(--color-text-body)]',
                  errors.title
                    ? 'border-[var(--color-danger)]'
                    : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
                )}
              />
              {errors.title && (
                <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                  {errors.title.message}
                </p>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                Description
              </label>
              <Textarea
                {...register('description')}
                error={errors.description?.message}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5 text-[var(--color-text-muted)]">
                Visibility
              </label>
              <SegmentedControl
                options={[
                  { value: 'public', label: 'Public' },
                  { value: 'private', label: 'Private' },
                ]}
                value={visibility}
                onChange={setVisibility}
              />
              <p className="mt-1.5 text-[12px] text-[var(--color-text-muted)]">
                {visibility === 'public'
                  ? 'Anyone with the link can watch.'
                  : 'The link stops working right away.'}
              </p>
            </div>

            <div
              className={cn(
                'flex items-start gap-2.5 px-3.5 py-3 rounded-lg',
                'bg-[var(--color-info-bg)]',
              )}
            >
              <Info
                size={15}
                className="shrink-0 mt-0.5 text-[var(--color-info)]"
              />
              <p className="text-[12px] text-[var(--color-text-secondary)]">
                The shareable link stays{' '}
                <span className="font-mono text-[var(--color-text-body)]">
                  /v/{video.slug}
                </span>{' '}
                even if you rename the video, so links you have already sent keep
                working.
              </p>
            </div>
          </div>
        </form>

        <div className="flex items-center justify-between px-6 py-4 border-t border-[var(--color-border)] shrink-0">
          <Button variant="ghost" size="md" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            form="edit-video-form"
            loading={loading}
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  )
}
