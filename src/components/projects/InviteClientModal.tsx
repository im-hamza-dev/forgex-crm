'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button, Input, Modal, toast } from '@/components/ui'
import { useInviteClient } from '@/hooks/useProjects'

const schema = z.object({
  full_name: z.string().min(1, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  company: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface InviteClientModalProps {
  open: boolean
  projectId: string
  onClose: () => void
}

export function InviteClientModal({
  open,
  projectId,
  onClose,
}: InviteClientModalProps) {
  const inviteClient = useInviteClient()
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { full_name: '', email: '', company: '' },
  })

  const submitting = isSubmitting || inviteClient.isPending

  const handleClose = () => {
    reset()
    onClose()
  }

  const onSubmit = async (values: FormValues) => {
    try {
      await inviteClient.mutateAsync({
        projectId,
        full_name: values.full_name.trim(),
        email: values.email.trim(),
        company: values.company?.trim() || undefined,
      })
      toast.success('Client invite sent')
      handleClose()
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to invite client',
      )
    }
  }

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Invite Client"
      description="Send a portal invite for this project."
      size="sm"
      footer={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="ghost" size="md" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="md"
            type="submit"
            form="invite-client-form"
            loading={submitting}
          >
            Send Invite
          </Button>
        </div>
      }
    >
      <form
        id="invite-client-form"
        onSubmit={handleSubmit(onSubmit)}
        className={`flex flex-col gap-3 ${submitting ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <Input
          label="Full name"
          placeholder="Jane Client"
          error={errors.full_name?.message}
          {...register('full_name')}
        />
        <Input
          label="Email"
          type="email"
          placeholder="jane@company.com"
          error={errors.email?.message}
          {...register('email')}
        />
        <Input
          label="Company"
          placeholder="Optional"
          {...register('company')}
        />
      </form>
    </Modal>
  )
}
