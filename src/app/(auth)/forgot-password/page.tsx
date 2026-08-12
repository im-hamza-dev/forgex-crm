'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, CheckCircle } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthCard, Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const schema = z.object({
  email: z.string().email('Enter a valid email'),
})

type Values = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [sentEmail, setSentEmail] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  // TODO: wire to Supabase in auth feature prompt
  const onSubmit = async (values: Values) => {
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800)) // placeholder
      setSentEmail(values.email)
      setSent(true)
    } finally {
      setIsLoading(false)
    }
  }

  if (sent) {
    return (
      <AuthCard>
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-4 bg-[var(--color-success-bg)]">
            <CheckCircle size={22} className="text-[var(--color-success)]" />
          </div>
          <h2 className="text-[20px] font-bold mb-2 text-[var(--color-text-heading)]">
            Check your email
          </h2>
          <p className="text-[14px] leading-relaxed mb-6 text-[var(--color-text-secondary)]">
            We sent a reset link to{' '}
            <span className="font-medium text-[var(--color-text-body)]">
              {sentEmail}
            </span>
            . It expires in 1 hour.
          </p>
          <Link
            href={ROUTES.LOGIN}
            className="text-[14px] font-medium transition-opacity hover:opacity-70 text-[var(--color-accent)]"
          >
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    )
  }

  return (
    <AuthCard>
      <Link
        href={ROUTES.LOGIN}
        className="inline-flex items-center gap-1.5 text-[13px] font-medium mb-6 transition-opacity hover:opacity-70 text-[var(--color-accent)]"
      >
        <ArrowLeft size={14} />
        Back to sign in
      </Link>

      <div className="mb-6">
        <h1 className="text-[22px] font-bold leading-tight mb-1 text-[var(--color-text-heading)]">
          Reset password
        </h1>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          Enter your email and we&apos;ll send a reset link.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="email"
            className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[var(--color-text-secondary)]"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            {...register('email')}
            className={cn(
              'w-full h-[44px] px-3.5 rounded-xl text-[14px]',
              'border outline-none transition-colors duration-150',
              'bg-[var(--color-surface)] text-[var(--color-text-body)]',
              errors.email
                ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
          />
          {errors.email && (
            <p className="text-[12px] text-[var(--color-danger)]">
              {errors.email.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full rounded-xl"
        >
          Send reset link
        </Button>
      </form>
    </AuthCard>
  )
}
