'use client'

import { useEffect, useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { cn } from '@/lib/utils'
import { Button, Select, toast } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import { useProjects } from '@/hooks/useProjects'
import { useCreateProjectTask, useCreateTask } from '@/hooks/useTasks'
import {
  canAssignTask,
  canLinkToProject,
} from '@/lib/task-permissions'

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
  defaultProjectId?: string
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

export function NewTaskModal({
  open,
  onClose,
  defaultProjectId,
}: NewTaskModalProps) {
  const { profile } = useAuth()
  const showAssign = canAssignTask(profile)
  const showProject = canLinkToProject(profile)
  const { data: projects = [] } = useProjects()
  const createTask = useCreateTask()
  const createProjectTask = useCreateProjectTask()

  const [teamOptions, setTeamOptions] = useState<
    { value: string; label: string }[]
  >([{ value: '', label: 'Unassigned' }])

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      priority: 'medium',
      project_id: defaultProjectId ?? '',
      assigned_to: '',
    },
  })

  useEffect(() => {
    if (!open || !showAssign) return
    const supabase = createClient()
    void supabase
      .from('profiles')
      .select('id, full_name')
      .eq('is_active', true)
      .then(({ data }) => {
        setTeamOptions([
          { value: '', label: 'Unassigned' },
          ...(data ?? []).map((p) => ({
            value: p.id,
            label: p.full_name ?? p.id,
          })),
        ])
      })
  }, [open, showAssign])

  useEffect(() => {
    if (open) {
      reset({
        title: '',
        description: '',
        priority: 'medium',
        project_id: defaultProjectId ?? '',
        assigned_to: '',
        due_date: '',
      })
    }
  }, [open, defaultProjectId, reset])

  const handleClose = () => {
    reset()
    onClose()
  }

  const onFormSubmit = async (values: FormValues) => {
    try {
      const payload = {
        title: values.title,
        description: values.description || undefined,
        priority: values.priority,
        due_date: values.due_date || undefined,
        assigned_to: values.assigned_to || undefined,
        project_id: values.project_id || undefined,
      }

      if (defaultProjectId) {
        await createProjectTask.mutateAsync({
          projectId: defaultProjectId,
          title: payload.title,
          description: payload.description,
          priority: payload.priority,
          due_date: payload.due_date,
          assigned_to: payload.assigned_to,
        })
      } else {
        await createTask.mutateAsync(payload)
      }
      toast.success('Task created')
      handleClose()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create task')
    }
  }

  if (!open) return null

  const isPending = createTask.isPending || createProjectTask.isPending

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

          {(showProject || showAssign) && (
            <div className="grid grid-cols-2 gap-3">
              {showProject && (
                <div>
                  <ModalFieldLabel>Project</ModalFieldLabel>
                  <Select
                    options={[
                      { value: '', label: 'None' },
                      ...projects.map((p) => ({
                        value: p.id,
                        label: p.name,
                      })),
                    ]}
                    disabled={Boolean(defaultProjectId)}
                    {...register('project_id')}
                  />
                </div>
              )}
              {showAssign && (
                <div className={showProject ? undefined : 'col-span-2'}>
                  <ModalFieldLabel>Assigned To</ModalFieldLabel>
                  <Select
                    options={teamOptions}
                    {...register('assigned_to')}
                  />
                </div>
              )}
            </div>
          )}

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
            loading={isPending}
          >
            Create Task
          </Button>
        </div>
      </div>
    </div>
  )
}
