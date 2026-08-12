'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button, Select } from '@/components/ui'

const schema = z.object({
  contact_name:     z.string().min(1, 'Contact name is required'),
  company:          z.string().optional(),
  email:            z.string().email('Invalid email').or(z.literal('')).optional(),
  phone:            z.string().optional(),
  linkedin_url:     z.string().optional(),
  source:           z.string(),
  service_interest: z.string().optional(),
  budget_range:     z.string().optional(),
  stage:            z.string(),
  assigned_to:      z.string().optional(),
  next_follow_up:   z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface NewLeadModalProps {
  open: boolean
  onClose: () => void
  defaultStage?: string
  onSubmit?: (values: FormValues & { priority: Priority }) => void
}

type Priority = 'hot' | 'warm' | 'cold'

const PRIORITY_OPTIONS: { value: Priority; label: string }[] = [
  { value: 'hot', label: 'Hot' },
  { value: 'warm', label: 'Warm' },
  { value: 'cold', label: 'Cold' },
]

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

function ModalInput({
  error,
  className,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { error?: string }) {
  return (
    <div>
      <input
        className={cn(
          'w-full h-[40px] px-3 rounded-lg text-[13px]',
          'border outline-none transition-colors',
          'bg-[var(--color-surface)] text-[var(--color-text-body)]',
          'placeholder:text-[var(--color-text-muted)]',
          error
            ? 'border-[var(--color-danger)]'
            : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
          className,
        )}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[11px] text-[var(--color-danger)]">{error}</p>
      )}
    </div>
  )
}

export function NewLeadModal({
  open,
  onClose,
  defaultStage = 'new_lead',
  onSubmit,
}: NewLeadModalProps) {
  const [priority, setPriority] = useState<Priority>('warm')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      source: 'website_form',
      stage: defaultStage,
      service_interest: '',
      budget_range: '',
      assigned_to: '',
    },
  })

  useEffect(() => {
    if (open) {
      reset({
        contact_name: '',
        company: '',
        email: '',
        phone: '',
        linkedin_url: '',
        source: 'website_form',
        stage: defaultStage,
        service_interest: '',
        budget_range: '',
        assigned_to: '',
        next_follow_up: '',
      })
      setPriority('warm')
    }
  }, [open, defaultStage, reset])

  const handleClose = () => {
    reset()
    setPriority('warm')
    onClose()
  }

  const onFormSubmit = (values: FormValues) => {
    onSubmit?.({ ...values, priority })
    handleClose()
  }

  if (!open) return null

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
            New Lead
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
          id="new-lead-form"
          onSubmit={handleSubmit(onFormSubmit)}
          className="flex-1 overflow-y-auto px-6 py-5"
        >
          <div className="flex flex-col gap-4">
            <div>
              <FieldLabel required>Contact Name</FieldLabel>
              <ModalInput
                error={errors.contact_name?.message}
                {...register('contact_name')}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Company</FieldLabel>
                <ModalInput {...register('company')} />
              </div>
              <div>
                <FieldLabel>Email</FieldLabel>
                <ModalInput
                  type="email"
                  error={errors.email?.message}
                  {...register('email')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Phone</FieldLabel>
                <ModalInput {...register('phone')} />
              </div>
              <div>
                <FieldLabel>LinkedIn URL</FieldLabel>
                <ModalInput {...register('linkedin_url')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Source</FieldLabel>
                <Select
                  options={[
                    { value: 'website_form', label: 'Website form' },
                    { value: 'referral', label: 'Referral' },
                    { value: 'cold_outreach', label: 'Cold outreach' },
                    { value: 'social', label: 'Social media' },
                    { value: 'other', label: 'Other' },
                  ]}
                  {...register('source')}
                />
              </div>
              <div>
                <FieldLabel>Service Interest</FieldLabel>
                <Select
                  options={[
                    { value: 'saas_mvp', label: 'SaaS MVP' },
                    { value: 'workflow_automation', label: 'Workflow Automation' },
                    { value: 'custom_crm', label: 'Custom CRM' },
                    { value: 'ai_agents', label: 'AI Agents' },
                    { value: 'tech_retainer', label: 'Tech Retainer' },
                    { value: 'other', label: 'Other' },
                  ]}
                  placeholder="Select..."
                  {...register('service_interest')}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Budget Range</FieldLabel>
                <Select
                  options={[
                    { value: 'under_5k', label: 'Under $5k' },
                    { value: '5k_10k', label: '$5k–$10k' },
                    { value: '10k_20k', label: '$10k–$20k' },
                    { value: '20k_50k', label: '$20k–$50k' },
                    { value: '50k_plus', label: '$50k+' },
                  ]}
                  placeholder="Select..."
                  {...register('budget_range')}
                />
              </div>
              <div>
                <FieldLabel>Stage</FieldLabel>
                <Select
                  options={[
                    { value: 'new_lead', label: 'New Lead' },
                    { value: 'contacted', label: 'Contacted' },
                    { value: 'qualified', label: 'Qualified' },
                    { value: 'proposal_sent', label: 'Proposal Sent' },
                    { value: 'negotiation', label: 'Negotiation' },
                    { value: 'won', label: 'Won' },
                    { value: 'lost', label: 'Lost' },
                  ]}
                  {...register('stage')}
                />
              </div>
            </div>

            <div>
              <FieldLabel>Priority</FieldLabel>
              <div className="flex rounded-lg border border-[var(--color-border)] overflow-hidden">
                {PRIORITY_OPTIONS.map((opt, i) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setPriority(opt.value)}
                    className={cn(
                      'flex-1 h-[40px] text-[13px] font-medium transition-colors',
                      i < PRIORITY_OPTIONS.length - 1 && 'border-r border-[var(--color-border)]',
                      priority === opt.value
                        ? 'bg-[var(--color-accent)] text-white'
                        : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)]',
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <FieldLabel>Assigned To</FieldLabel>
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
              <div>
                <FieldLabel>Next Follow-Up</FieldLabel>
                <ModalInput type="date" {...register('next_follow_up')} />
              </div>
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
            form="new-lead-form"
            loading={isSubmitting}
          >
            Create Lead
          </Button>
        </div>
      </div>
    </div>
  )
}
