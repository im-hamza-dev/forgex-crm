'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useRouter } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, AuthWordmark, Button, toast } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type Values = z.infer<typeof schema>

export default function SetupPage() {
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
      const { error } = await supabase.auth.signUp({
        email: values.email,
        password: values.password,
        options: { data: { full_name: values.full_name } },
      })
      if (error) {
        toast.error(error.message)
        return
      }
      toast.success('Admin account created. Check your email to confirm.')
      router.push(ROUTES.LOGIN)
    } catch {
      toast.error('Something went wrong.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthWordmark />

      <div
        className="mb-5 px-3 py-2.5 rounded-lg text-[12px]"
        style={{
          background: 'var(--color-accent-subtle)',
          color: 'var(--color-accent)',
        }}
      >
        <strong>First-time setup only.</strong> After this, all accounts are
        created via invites.
      </div>

      <h1
        className="text-[22px] font-bold mb-6"
        style={{ color: 'var(--color-text-heading)' }}
      >
        Create admin account
      </h1>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label
            className="block text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Full Name
          </label>
          <input
            type="text"
            placeholder="Hamza Iqbal"
            {...register('full_name')}
            className={cn(
              'w-full h-[44px] px-3.5 rounded-xl text-[14px] border outline-none transition-colors',
              'placeholder:text-[var(--color-text-muted)]',
              errors.full_name
                ? 'border-[var(--color-danger)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-body)',
            }}
          />
          {errors.full_name && (
            <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
              {errors.full_name.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            className="block text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Email
          </label>
          <input
            type="email"
            placeholder="you@forgex.systems"
            {...register('email')}
            className={cn(
              'w-full h-[44px] px-3.5 rounded-xl text-[14px] border outline-none transition-colors',
              'placeholder:text-[var(--color-text-muted)]',
              errors.email
                ? 'border-[var(--color-danger)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
            style={{
              background: 'var(--color-surface)',
              color: 'var(--color-text-body)',
            }}
          />
          {errors.email && (
            <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            className="block text-[11px] font-semibold uppercase tracking-[0.06em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Min. 8 characters"
              {...register('password')}
              className={cn(
                'w-full h-[44px] px-3.5 pr-11 rounded-xl text-[14px] border outline-none transition-colors',
                'placeholder:text-[var(--color-text-muted)]',
                errors.password
                  ? 'border-[var(--color-danger)]'
                  : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
              )}
              style={{
                background: 'var(--color-surface)',
                color: 'var(--color-text-body)',
              }}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 transition-opacity hover:opacity-70"
              style={{ color: 'var(--color-text-muted)' }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
              {errors.password.message}
            </p>
          )}
        </div>

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full rounded-xl mt-2"
        >
          Create admin account
        </Button>
      </form>
    </AuthCard>
  )
}
