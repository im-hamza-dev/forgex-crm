'use client'

import type { InputHTMLAttributes, ReactNode } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Button, Select } from '@/components/ui'

const schema = z.object({
  title: z.string().min(1, 'Title is required'),
  project_id: z.string().optional(),
  assigned_to: z.string().optional(),
  due_date: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent']),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface NewTaskModalProps {
  open: boolean
  onClose: () => void
  onSubmit?: (values: FormValues) => void
}

function ModalFieldLabel({
  children,
  required,
}: {
  children: ReactNode
  required?: boolean
}) {
  return (
    <label
      className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
      {required && <span style={{ color: 'var(--color-accent)' }}> *</span>}
    </label>
  )
}

function ModalInput({
  error,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        className={cn(
          'w-full h-[40px] px-3 rounded-lg text-[13px]',
          'border outline-none transition-colors',
          'placeholder:text-[var(--color-text-muted)]',
          error
            ? 'border-[var(--color-danger)]'
            : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
          className,
        )}
        style={{
          background: 'var(--color-surface)',
          color: 'var(--color-text-body)',
        }}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[11px]" style={{ color: 'var(--color-danger)' }}>
          {error}
        </p>
      )}
    </div>
  )
}

export function NewTaskModal({ open, onClose, onSubmit }: NewTaskModalProps) {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { priority: 'low' },
  })

  const handleClose = () => {
    reset()
    onClose()
  }

  const onFormSubmit = (values: FormValues) => {
    onSubmit?.(values)
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
          'relative z-10 w-full max-w-[480px]',
          'bg-[var(--color-surface)] rounded-2xl',
          'shadow-[0_16px_48px_rgba(26,16,8,0.16)]',
          'flex flex-col',
        )}
      >
        <div
          className="flex items-center justify-between px-6 py-5 border-b shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <h2
            className="text-[18px] font-bold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            New Task
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
          id="new-task-form"
          onSubmit={handleSubmit(onFormSubmit)}
          className="px-6 py-5 flex flex-col gap-4"
        >
          <div>
            <ModalFieldLabel required>Title</ModalFieldLabel>
            <ModalInput
              placeholder="Task title..."
              error={errors.title?.message}
              {...register('title')}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <ModalFieldLabel>Project</ModalFieldLabel>
              <Select
                options={[
                  { value: '', label: 'None' },
                  { value: '2', label: 'Patient Acquisition System' },
                  { value: '3', label: 'B2B Pipeline OS' },
                  { value: '1', label: 'Coaching Growth Platform' },
                  { value: '4', label: 'Tax AI MVP' },
                ]}
                {...register('project_id')}
              />
            </div>
            <div>
              <ModalFieldLabel>Assigned To</ModalFieldLabel>
              <Select
                options={[
                  { value: '', label: 'Unassigned' },
                  { value: 'user-hi', label: 'Hamza Iqbal' },
                  { value: 'user-sa', label: 'Sara Ahmed' },
                  { value: 'user-zm', label: 'Zain Malik' },
                ]}
                {...register('assigned_to')}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <ModalFieldLabel>Due Date</ModalFieldLabel>
              <ModalInput type="date" {...register('due_date')} />
            </div>
            <div>
              <ModalFieldLabel>Priority</ModalFieldLabel>
              <Select
                options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                  { value: 'urgent', label: 'Urgent' },
                ]}
                {...register('priority')}
              />
            </div>
          </div>

          <div>
            <ModalFieldLabel>Description</ModalFieldLabel>
            <textarea
              className={cn(
                'w-full min-h-[100px] px-3 py-2.5 rounded-lg text-[13px]',
                'border outline-none transition-colors resize-y',
                'placeholder:text-[var(--color-text-muted)]',
                'border-[var(--color-border)] focus:border-[var(--color-accent)]',
              )}
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-body)',
              }}
              {...register('description')}
            />
          </div>
        </form>

        <div
          className="flex items-center justify-between px-6 py-4 border-t shrink-0"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <Button variant="ghost" size="md" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            form="new-task-form"
            loading={isSubmitting}
          >
            Create Task
          </Button>
        </div>
      </div>
    </div>
  )
}
