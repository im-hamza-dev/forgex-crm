'use client'

import { Suspense, useMemo } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { DashboardShell } from '@/components/layout'
import { Button, Input, Select, Textarea, toast } from '@/components/ui'
import { useCreateProject } from '@/hooks/useProjects'
import { ROUTES } from '@/constants/routes'

const SERVICE_OPTIONS = [
  { value: 'saas_mvp', label: 'SaaS MVP' },
  { value: 'workflow_automation', label: 'Workflow Automation' },
  { value: 'custom_crm', label: 'Custom CRM' },
  { value: 'ai_agents', label: 'AI Agents' },
  { value: 'tech_retainer', label: 'Tech Retainer' },
  { value: 'other', label: 'Other' },
] as const

const STATUS_OPTIONS = [
  { value: 'discovery', label: 'Discovery' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'review', label: 'Review' },
  { value: 'delivered', label: 'Delivered' },
  { value: 'retainer', label: 'Retainer' },
  { value: 'on_hold', label: 'On Hold' },
  { value: 'cancelled', label: 'Cancelled' },
] as const

const PAYMENT_OPTIONS = [
  { value: 'pending', label: 'Pending' },
  { value: 'partial', label: 'Partial' },
  { value: 'paid', label: 'Paid' },
  { value: 'overdue', label: 'Overdue' },
] as const

const CURRENCY_OPTIONS = [
  { value: 'USD', label: 'USD' },
  { value: 'GBP', label: 'GBP' },
  { value: 'EUR', label: 'EUR' },
  { value: 'PKR', label: 'PKR' },
] as const

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  service_type: z
    .enum([
      'saas_mvp',
      'workflow_automation',
      'custom_crm',
      'ai_agents',
      'tech_retainer',
      'other',
      '',
    ])
    .optional(),
  status: z.enum([
    'discovery',
    'in_progress',
    'review',
    'delivered',
    'retainer',
    'on_hold',
    'cancelled',
  ]),
  payment_status: z.enum(['pending', 'partial', 'paid', 'overdue']),
  fixed_price: z.string().optional(),
  currency: z.enum(['USD', 'GBP', 'EUR', 'PKR']),
  start_date: z.string().optional(),
  deadline: z.string().optional(),
  is_client_visible: z.boolean(),
})

type FormValues = z.infer<typeof schema>

const SERVICE_VALUES = new Set([
  'saas_mvp',
  'workflow_automation',
  'custom_crm',
  'ai_agents',
  'tech_retainer',
  'other',
])

function parseBudget(raw: string | null): string {
  if (!raw) return ''
  return raw.replace(/[^0-9.]/g, '')
}

function NewProjectForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const createProject = useCreateProject()

  const leadId = searchParams.get('lead_id')
  const prefillName = searchParams.get('name') ?? ''
  const prefillService = searchParams.get('service_type')
  const prefillBudget = parseBudget(searchParams.get('budget'))

  const defaultService =
    prefillService && SERVICE_VALUES.has(prefillService)
      ? (prefillService as FormValues['service_type'])
      : ''

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: prefillName,
      description: '',
      service_type: defaultService,
      status: 'discovery',
      payment_status: 'pending',
      fixed_price: prefillBudget,
      currency: 'USD',
      start_date: '',
      deadline: '',
      is_client_visible: false,
    },
  })

  const submitting = isSubmitting || createProject.isPending

  const onSubmit = async (values: FormValues) => {
    try {
      const fixedPriceRaw = values.fixed_price?.trim()
      const fixedPrice =
        fixedPriceRaw && fixedPriceRaw.length > 0
          ? Number(fixedPriceRaw)
          : undefined

      const body: Record<string, unknown> = {
        name: values.name.trim(),
        description: values.description?.trim() || undefined,
        service_type: values.service_type || undefined,
        status: values.status,
        payment_status: values.payment_status,
        currency: values.currency,
        start_date: values.start_date || undefined,
        deadline: values.deadline || undefined,
        is_client_visible: values.is_client_visible,
        fixed_price:
          fixedPrice !== undefined && !Number.isNaN(fixedPrice)
            ? fixedPrice
            : undefined,
      }

      if (leadId) {
        body.lead_id = leadId
      }

      const project = await createProject.mutateAsync(body)
      toast.success('Project created')
      router.push(ROUTES.PROJECT(project.id))
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to create project',
      )
    }
  }

  const formDisabledClass = useMemo(
    () => (submitting ? 'opacity-60 pointer-events-none' : ''),
    [submitting],
  )

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className={`max-w-[640px] flex flex-col gap-5 ${formDisabledClass}`}
    >
      <div
        className="rounded-xl border bg-[var(--color-surface)] p-6 flex flex-col gap-4"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <Input
          label="Project name"
          placeholder="Project name"
          error={errors.name?.message}
          {...register('name')}
        />

        <Textarea
          label="Description"
          placeholder="What are we building?"
          rows={4}
          {...register('description')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Service type"
            options={[
              { value: '', label: 'Select…' },
              ...SERVICE_OPTIONS.map((o) => ({
                value: o.value,
                label: o.label,
              })),
            ]}
            {...register('service_type')}
          />
          <Select
            label="Status"
            options={STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            {...register('status')}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Select
            label="Payment status"
            options={PAYMENT_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            {...register('payment_status')}
          />
          <Select
            label="Currency"
            options={CURRENCY_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            {...register('currency')}
          />
        </div>

        <Input
          label="Fixed price"
          type="number"
          min={0}
          step="0.01"
          placeholder="0"
          {...register('fixed_price')}
        />

        <div className="grid grid-cols-2 gap-3">
          <Input label="Start date" type="date" {...register('start_date')} />
          <Input label="Deadline" type="date" {...register('deadline')} />
        </div>

        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 accent-[var(--color-accent)]"
            {...register('is_client_visible')}
          />
          <span
            className="text-[13px]"
            style={{ color: 'var(--color-text-body)' }}
          >
            Visible to client
          </span>
        </label>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          size="md"
          onClick={() => router.push(ROUTES.PROJECTS)}
        >
          Cancel
        </Button>
        <Button type="submit" variant="primary" size="md" loading={submitting}>
          Create Project
        </Button>
      </div>
    </form>
  )
}

export default function NewProjectPage() {
  return (
    <DashboardShell
      title="New Project"
      breadcrumb={[
        { label: 'Projects', href: ROUTES.PROJECTS },
        { label: 'New Project' },
      ]}
      notificationCount={0}
    >
      <Suspense
        fallback={
          <div className="max-w-[640px] h-[420px] rounded-xl animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]" />
        }
      >
        <NewProjectForm />
      </Suspense>
    </DashboardShell>
  )
}
