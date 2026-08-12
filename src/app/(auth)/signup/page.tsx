'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  AuthCard,
  AuthWordmark,
  AuthDivider,
  GoogleButton,
  Button,
} from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const schema = z.object({
  full_name: z.string().min(2, 'Enter your full name'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
})

type Values = z.infer<typeof schema>

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  // TODO: wire to Supabase in auth feature prompt
  const onSubmit = async (_values: Values) => {
    setIsLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setIsGoogleLoading(true)
    try {
      await new Promise((r) => setTimeout(r, 800))
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthWordmark />

      <div className="mb-6">
        <h1 className="text-[22px] font-bold leading-tight mb-1 text-[var(--color-text-heading)]">
          Create account
        </h1>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          Set up your Forgex CRM workspace.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-1.5">
          <label
            htmlFor="full_name"
            className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[var(--color-text-secondary)]"
          >
            Full name
          </label>
          <input
            id="full_name"
            type="text"
            autoComplete="name"
            placeholder="Hamza Iqbal"
            {...register('full_name')}
            className={cn(
              'w-full h-[44px] px-3.5 rounded-xl text-[14px]',
              'border outline-none transition-colors duration-150',
              'bg-[var(--color-surface)] text-[var(--color-text-body)]',
              'placeholder:text-[var(--color-text-muted)]',
              errors.full_name
                ? 'border-[var(--color-danger)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
          />
          {errors.full_name && (
            <p className="text-[12px] text-[var(--color-danger)]">
              {errors.full_name.message}
            </p>
          )}
        </div>

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
            placeholder="you@forgex.systems"
            {...register('email')}
            className={cn(
              'w-full h-[44px] px-3.5 rounded-xl text-[14px]',
              'border outline-none transition-colors duration-150',
              'bg-[var(--color-surface)] text-[var(--color-text-body)]',
              'placeholder:text-[var(--color-text-muted)]',
              errors.email
                ? 'border-[var(--color-danger)]'
                : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            )}
          />
          {errors.email && (
            <p className="text-[12px] text-[var(--color-danger)]">
              {errors.email.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label
            htmlFor="password"
            className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[var(--color-text-secondary)]"
          >
            Password
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Min. 8 characters"
              {...register('password')}
              className={cn(
                'w-full h-[44px] px-3.5 pr-11 rounded-xl text-[14px]',
                'border outline-none transition-colors duration-150',
                'bg-[var(--color-surface)] text-[var(--color-text-body)]',
                'placeholder:text-[var(--color-text-muted)]',
                errors.password
                  ? 'border-[var(--color-danger)]'
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full rounded-xl mt-2"
        >
          Create account
        </Button>
      </form>

      <AuthDivider />

      <GoogleButton
        onClick={handleGoogle}
        loading={isGoogleLoading}
        label="Sign up with Google"
      />

      <p className="mt-5 text-center text-[13px] text-[var(--color-text-muted)]">
        Already have an account?{' '}
        <Link
          href={ROUTES.LOGIN}
          className="font-semibold transition-opacity hover:opacity-70 text-[var(--color-text-heading)]"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  )
}
