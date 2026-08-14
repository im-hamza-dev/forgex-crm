'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { X, ChevronDown, ExternalLink } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Button, toast } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import {
  canAssignCalendarEntry,
  canDeleteCalendarEntry,
  canEditCalendarEntry,
} from '@/lib/calendar-permissions'
import {
  useCreateCalendarEntry,
  useDeleteCalendarEntry,
  useUpdateCalendarEntry,
} from '@/hooks/useCalendar'
import {
  ENTRY_TYPE_CONFIG,
  type CalendarEntry,
  type CalendarEntryStatus,
  type CalendarEntryType,
} from '@/types/calendar'
import type { AuthProfile } from '@/stores/auth-store'

const ENTRY_TYPES: CalendarEntryType[] = [
  'content',
  'meeting',
  'deadline',
  'followup',
  'task',
  'other',
]

const COLOR_SWATCHES = ENTRY_TYPES.map((type) => ENTRY_TYPE_CONFIG[type].dot)

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  planned_date: z.string().min(1, 'Date is required'),
  entry_type: z.enum([
    'content',
    'meeting',
    'deadline',
    'followup',
    'task',
    'other',
  ]),
  status: z.enum(['idea', 'draft', 'in_review', 'scheduled', 'published']),
  notes: z.string(),
  is_all_day: z.boolean(),
  scheduled_time: z.string(),
  assigned_to: z.string(),
  color: z.string(),
})

type FormValues = z.infer<typeof schema>

interface PlanPostModalProps {
  open: boolean
  onClose: () => void
  defaultDate?: string
  entry?: CalendarEntry | null
  profile?: AuthProfile | null
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

function sourceHref(entry: CalendarEntry): string | null {
  if (!entry.source_type || !entry.source_id) return null
  if (entry.source_type === 'lead') return `/leads?open=${entry.source_id}`
  if (entry.source_type === 'project' || entry.source_type === 'milestone') {
    return `/projects/${entry.source_id}`
  }
  if (entry.source_type === 'task') return `/tasks?open=${entry.source_id}`
  if (entry.source_type === 'blog') return `/blog/${entry.source_id}`
  return null
}

export function PlanPostModal({
  open,
  onClose,
  defaultDate,
  entry = null,
  profile = null,
}: PlanPostModalProps) {
  const router = useRouter()
  const today = new Date().toISOString().split('T')[0]!
  const isEditing = Boolean(entry) && !entry?.is_system
  const isSystem = Boolean(entry?.is_system)
  const canEdit = entry
    ? canEditCalendarEntry(profile, entry)
    : Boolean(profile)
  const canDelete = entry ? canDeleteCalendarEntry(profile, entry) : false
  const canAssign = canAssignCalendarEntry(profile)
  const readOnly = isSystem || (isEditing && !canEdit)

  const createEntry = useCreateCalendarEntry()
  const updateEntry = useUpdateCalendarEntry()
  const deleteEntry = useDeleteCalendarEntry()
  const [teamOptions, setTeamOptions] = useState<
    { value: string; label: string }[]
  >([{ value: '', label: 'Unassigned' }])

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: '',
      planned_date: defaultDate ?? today,
      entry_type: 'content',
      status: 'idea',
      notes: '',
      is_all_day: true,
      scheduled_time: '',
      assigned_to: '',
      color: ENTRY_TYPE_CONFIG.content.dot,
    },
  })

  const isAllDay = watch('is_all_day')
  const selectedType = watch('entry_type')
  const selectedColor = watch('color')

  useEffect(() => {
    if (!open || !canAssign) return
    const supabase = createClient()
    void supabase
      .from('profiles')
      .select('id, full_name, role')
      .eq('is_active', true)
      .in('role', ['admin', 'manager'])
      .then(({ data }) => {
        setTeamOptions([
          { value: '', label: 'Unassigned' },
          ...(data ?? []).map((p) => ({
            value: p.id,
            label: p.full_name ?? p.id,
          })),
        ])
      })
  }, [open, canAssign])

  useEffect(() => {
    if (!open) return
    if (entry) {
      reset({
        title: entry.title,
        planned_date: entry.planned_date,
        entry_type: entry.entry_type,
        status: entry.status,
        notes: entry.notes ?? entry.description ?? '',
        is_all_day: entry.is_all_day,
        scheduled_time: entry.scheduled_time?.slice(0, 5) ?? '',
        assigned_to: entry.assigned_to ?? '',
        color: entry.color ?? ENTRY_TYPE_CONFIG[entry.entry_type].dot,
      })
      return
    }
    reset({
      title: '',
      planned_date: defaultDate ?? today,
      entry_type: 'content',
      status: 'idea',
      notes: '',
      is_all_day: true,
      scheduled_time: '',
      assigned_to: '',
      color: ENTRY_TYPE_CONFIG.content.dot,
    })
  }, [open, defaultDate, today, reset, entry])

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    const payload = {
      title: values.title.trim(),
      planned_date: values.planned_date,
      entry_type: values.entry_type,
      status: values.status,
      notes: values.notes.trim() || null,
      is_all_day: values.is_all_day,
      scheduled_time: values.is_all_day
        ? null
        : values.scheduled_time || null,
      assigned_to: canAssign && values.assigned_to ? values.assigned_to : null,
      color: values.color || null,
    }

    try {
      if (isEditing && entry) {
        await updateEntry.mutateAsync({ id: entry.id, data: payload })
        toast.success('Entry updated')
      } else {
        await createEntry.mutateAsync(payload)
        toast.success('Entry created')
      }
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Save failed')
    }
  }

  const handleDelete = async () => {
    if (!entry) return
    try {
      await deleteEntry.mutateAsync(entry.id)
      toast.success('Entry deleted')
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Delete failed')
    }
  }

  const isSaving =
    createEntry.isPending || updateEntry.isPending || deleteEntry.isPending

  if (!open) return null

  const typeConfig = entry
    ? (ENTRY_TYPE_CONFIG[entry.entry_type] ?? ENTRY_TYPE_CONFIG.other)
    : ENTRY_TYPE_CONFIG.content
  const href = entry ? sourceHref(entry) : null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-[rgba(26,16,8,0.5)]"
        onClick={handleClose}
      />

      <div
        className={cn(
          'relative z-10 w-full max-w-[420px] max-h-[90vh] overflow-y-auto',
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
            {isSystem
              ? 'System entry'
              : isEditing
                ? 'Edit entry'
                : 'New entry'}
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

        {isSystem && entry ? (
          <div className="px-5 py-4 flex flex-col gap-4">
            <div>
              <p
                className="text-[16px] font-semibold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                {entry.title}
              </p>
              <p
                className="text-[13px] mt-1"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {entry.planned_date}
              </p>
            </div>
            <span
              className="inline-flex self-start px-2.5 py-1 rounded-full text-[11px] font-semibold"
              style={{ background: typeConfig.bg, color: typeConfig.text }}
            >
              {typeConfig.label}
            </span>
            <p
              className="text-[13px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              System entry — edit from source
            </p>
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
                Close
              </button>
              {href && (
                <Button
                  variant="primary"
                  size="sm"
                  type="button"
                  onClick={() => {
                    handleClose()
                    router.push(href)
                  }}
                >
                  <ExternalLink size={13} />
                  Open source
                </Button>
              )}
            </div>
          </div>
        ) : (
          <form
            id="plan-post-form"
            onSubmit={(e) => {
              void handleSubmit(onSubmit)(e)
            }}
            className="px-5 py-4 flex flex-col gap-3"
          >
            <div>
              <FieldLabel>Title</FieldLabel>
              <input
                placeholder="Entry title..."
                disabled={readOnly}
                className={cn(
                  'w-full h-[40px] px-3 rounded-lg text-[13px]',
                  'border outline-none transition-colors',
                  'placeholder:text-[var(--color-text-muted)]',
                  'disabled:opacity-60',
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
              <FieldLabel>Entry type</FieldLabel>
              <div className="flex flex-wrap gap-1.5">
                {ENTRY_TYPES.map((type) => {
                  const config = ENTRY_TYPE_CONFIG[type]
                  const active = selectedType === type
                  return (
                    <button
                      key={type}
                      type="button"
                      disabled={readOnly}
                      onClick={() => {
                        setValue('entry_type', type)
                        setValue('color', config.dot)
                      }}
                      className={cn(
                        'h-[28px] px-2.5 rounded-full text-[11px] font-medium border transition-colors',
                        'disabled:opacity-60',
                      )}
                      style={{
                        background: active ? config.bg : 'transparent',
                        color: active
                          ? config.text
                          : 'var(--color-text-secondary)',
                        borderColor: active
                          ? config.dot
                          : 'var(--color-border)',
                      }}
                    >
                      {config.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div>
              <FieldLabel>Date</FieldLabel>
              <input
                type="date"
                disabled={readOnly}
                className={cn(
                  'w-full h-[40px] px-3 rounded-lg text-[13px]',
                  'border outline-none transition-colors',
                  'border-[var(--color-border)] focus:border-[var(--color-accent)]',
                  'disabled:opacity-60',
                )}
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-body)',
                }}
                {...register('planned_date')}
              />
            </div>

            <label className="flex items-center gap-2 text-[13px]">
              <input
                type="checkbox"
                disabled={readOnly}
                {...register('is_all_day')}
              />
              <span style={{ color: 'var(--color-text-body)' }}>All day</span>
            </label>

            {!isAllDay && (
              <div>
                <FieldLabel>Time</FieldLabel>
                <input
                  type="time"
                  disabled={readOnly}
                  className={cn(
                    'w-full h-[40px] px-3 rounded-lg text-[13px]',
                    'border outline-none transition-colors',
                    'border-[var(--color-border)] focus:border-[var(--color-accent)]',
                    'disabled:opacity-60',
                  )}
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-body)',
                  }}
                  {...register('scheduled_time')}
                />
              </div>
            )}

            <div>
              <FieldLabel>Notes</FieldLabel>
              <textarea
                rows={3}
                disabled={readOnly}
                className={cn(
                  'w-full px-3 py-2 rounded-lg text-[13px] resize-none',
                  'border outline-none transition-colors',
                  'border-[var(--color-border)] focus:border-[var(--color-accent)]',
                  'disabled:opacity-60',
                )}
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-body)',
                }}
                {...register('notes')}
              />
            </div>

            <div>
              <FieldLabel>Status</FieldLabel>
              <div className="relative">
                <select
                  disabled={readOnly}
                  className={cn(
                    'w-full h-[40px] pl-3 pr-8 rounded-lg text-[13px] appearance-none',
                    'border outline-none transition-colors cursor-pointer',
                    'border-[var(--color-border)] focus:border-[var(--color-accent)]',
                    'disabled:opacity-60',
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

            {canAssign && (
              <div>
                <FieldLabel>Assigned to</FieldLabel>
                <div className="relative">
                  <select
                    disabled={readOnly}
                    className={cn(
                      'w-full h-[40px] pl-3 pr-8 rounded-lg text-[13px] appearance-none',
                      'border outline-none transition-colors cursor-pointer',
                      'border-[var(--color-border)] focus:border-[var(--color-accent)]',
                      'disabled:opacity-60',
                    )}
                    style={{
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-body)',
                    }}
                    {...register('assigned_to')}
                  >
                    {teamOptions.map((opt) => (
                      <option key={opt.value || 'none'} value={opt.value}>
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
            )}

            <div>
              <FieldLabel>Color</FieldLabel>
              <div className="flex items-center gap-2">
                {COLOR_SWATCHES.map((swatch) => (
                  <button
                    key={swatch}
                    type="button"
                    disabled={readOnly}
                    aria-label={`Color ${swatch}`}
                    onClick={() => setValue('color', swatch)}
                    className={cn(
                      'w-6 h-6 rounded-full border-2 transition-transform',
                      selectedColor === swatch
                        ? 'scale-110'
                        : 'border-transparent',
                      'disabled:opacity-60',
                    )}
                    style={{
                      background: swatch,
                      borderColor:
                        selectedColor === swatch
                          ? 'var(--color-text-heading)'
                          : 'transparent',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              {isEditing && canDelete && (
                <button
                  type="button"
                  disabled={isSaving}
                  onClick={() => void handleDelete()}
                  className="mr-auto h-[36px] px-4 rounded-lg text-[13px] font-medium text-[var(--color-danger)] disabled:opacity-50"
                >
                  {deleteEntry.isPending ? 'Deleting...' : 'Delete'}
                </button>
              )}
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
              {!readOnly && (
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  form="plan-post-form"
                  loading={isSaving}
                >
                  {isEditing ? 'Update' : 'Create'}
                </Button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
