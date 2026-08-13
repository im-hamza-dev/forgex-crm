'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthCard, Button, toast } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const schema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm: z.string().min(1, 'Please confirm your password'),
  })
  .refine((v) => v.password === v.confirm, {
    message: 'Passwords do not match',
    path: ['confirm'],
  })

type Values = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  const onSubmit = async (values: Values) => {
    setIsLoading(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (error) {
        toast.error(error.message)
        return
      }

      toast.success('Password updated successfully.')
      router.push(ROUTES.LOGIN)
    } catch {
      toast.error('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard>
      <div className="mb-6">
        <h1 className="text-[22px] font-bold leading-tight mb-1 text-[var(--color-text-heading)]">
          Set new password
        </h1>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          Choose a strong password for your account.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[var(--color-text-secondary)]"
          >
            New password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              {...register('password')}
              className={cn(
                'w-full h-[44px] px-3.5 pr-11 rounded-xl text-[14px]',
                'border outline-none transition-colors duration-150',
                'bg-[var(--color-surface)] text-[var(--color-text-body)]',
                errors.password
                  ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
                  : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
              )}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70 text-[var(--color-text-muted)]"
              tabIndex={-1}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[12px] text-[var(--color-danger)]">
              {errors.password.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="confirm"
            className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[var(--color-text-secondary)]"
          >
            Confirm password
          </label>
          <input
            id="confirm"
            type={showPassword ? 'text' : 'password'}
            autoComplete="new-password"
            {...register('confirm')}
            className={cn(
              'w-full h-[44px] px-3.5 rounded-xl text-[14px]',
              'border outline-none transition-colors duration-150',
              'bg-[var(--color-surface)] text-[var(--color-text-body)]',
              errors.confirm
                ? 'border-[var(--color-danger)] focus:border-[var(--color-danger)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
          />
          {errors.confirm && (
            <p className="text-[12px] text-[var(--color-danger)]">
              {errors.confirm.message}
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
          Update password
        </Button>
      </form>
    </AuthCard>
  )
}
