'use client'

import { useEffect, type ReactNode } from 'react'
import { X, ChevronDown } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui'
import type { CalendarEntryStatus } from '@/types/calendar'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  planned_date: z.string().min(1, 'Date is required'),
  status: z.enum(['idea', 'draft', 'in_review', 'scheduled', 'published']),
})

type FormValues = z.infer<typeof schema>

interface PlanPostModalProps {
  open: boolean
  onClose: () => void
  defaultDate?: string
  onSave?: (values: FormValues) => void
}

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label
      className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
    </label>
  )
}

const STATUS_OPTIONS: { value: CalendarEntryStatus; label: string }[] = [
  { value: 'idea', label: 'Idea' },
  { value: 'draft', label: 'Draft' },
  { value: 'in_review', label: 'In Review' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'published', label: 'Published' },
]

export function PlanPostModal({
  open,
  onClose,
  defaultDate,
  onSave,
}: PlanPostModalProps) {
  const today = new Date().toISOString().split('T')[0]!

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      planned_date: defaultDate ?? today,
      status: 'draft',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        title: '',
        planned_date: defaultDate ?? today,
        status: 'draft',
      })
    }
  }, [open, defaultDate, today, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = (values: FormValues) => {
    onSave?.(values)
    handleClose()
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(26,16,8,0.5)]"
        onClick={handleClose}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-[400px]',
          'bg-[var(--color-surface)] rounded-2xl',
          'shadow-[0_16px_48px_rgba(26,16,8,0.16)]',
        )}
      >
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2
            className="text-[16px] font-bold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Plan Post
          </h2>
          <button
            type="button"
            onClick={handleClose}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-lg',
              'text-[var(--color-text-muted)] transition-colors',
              'hover:bg-[var(--color-surface-hover)]',
            )}
            aria-label="Close"
          >
            <X size={15} />
          </button>
        </div>

        <form
          id="plan-post-form"
          onSubmit={handleSubmit(onSubmit)}
          className="px-5 py-4 flex flex-col gap-3"
        >
          <div>
            <FieldLabel>Title</FieldLabel>
            <input
              placeholder="Post topic..."
              className={cn(
                'w-full h-[40px] px-3 rounded-lg text-[13px]',
                'border outline-none transition-colors',
                'placeholder:text-[var(--color-text-muted)]',
                errors.title
                  ? 'border-[var(--color-danger)]'
                  : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
              )}
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-body)',
              }}
              {...register('title')}
            />
            {errors.title && (
              <p
                className="mt-1 text-[11px]"
                style={{ color: 'var(--color-danger)' }}
              >
                {errors.title.message}
              </p>
            )}
          </div>

          <div>
            <FieldLabel>Date</FieldLabel>
            <input
              type="date"
              className={cn(
                'w-full h-[40px] px-3 rounded-lg text-[13px]',
                'border outline-none transition-colors',
                'border-[var(--color-border)] focus:border-[var(--color-accent)]',
              )}
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-body)',
              }}
              {...register('planned_date')}
            />
          </div>

          <div>
            <FieldLabel>Status</FieldLabel>
            <div className="relative">
              <select
                className={cn(
                  'w-full h-[40px] pl-3 pr-8 rounded-lg text-[13px] appearance-none',
                  'border outline-none transition-colors cursor-pointer',
                  'border-[var(--color-border)] focus:border-[var(--color-accent)]',
                )}
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-body)',
                }}
                {...register('status')}
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={12}
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2"
                style={{ color: 'var(--color-text-muted)' }}
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={handleClose}
              className={cn(
                'h-[36px] px-4 rounded-lg text-[13px] font-medium border transition-colors',
                'hover:bg-[var(--color-surface-hover)]',
              )}
              style={{
                borderColor: 'var(--color-border)',
                color: 'var(--color-text-body)',
              }}
            >
              Cancel
            </button>
            <Button
              variant="primary"
              size="sm"
              type="submit"
              form="plan-post-form"
              loading={isSubmitting}
            >
              Save
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
