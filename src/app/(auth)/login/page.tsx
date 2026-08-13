'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
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
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof loginSchema>

function LoginForm() {
  const searchParams = useSearchParams()
  const redirectTo = searchParams.get('redirectTo') ?? ROUTES.DASHBOARD
  const errorParam = searchParams.get('error')
  let errorMessage: string | null = null
  if (errorParam === 'not_invited') {
    errorMessage = 'This account has not been invited. Contact your administrator.'
  }

  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({ resolver: zodResolver(loginSchema) })

  const onSubmit = async (values: LoginValues) => {
    setIsLoading(true)
    setError(null)
    try {
      const supabase = createClient()
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: values.email,
        password: values.password,
      })

      if (signInError) {
        setError(
          signInError.message === 'Invalid login credentials'
            ? 'Incorrect email or password'
            : signInError.message,
        )
        return
      }

      window.location.href = redirectTo
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGoogle = async () => {
    setIsGoogleLoading(true)
    try {
      const supabase = createClient()
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/api/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      })
      if (oauthError) {
        setError(oauthError.message)
      }
    } catch {
      setError('Google sign in failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthWordmark />

      <div className="mb-6">
        <h1 className="text-[22px] font-bold leading-tight mb-1 text-[var(--color-text-heading)]">
          Sign in
        </h1>
        <p className="text-[14px] text-[var(--color-text-secondary)]">
          Welcome back to your workspace
        </p>
      </div>

      {!!(error || errorMessage) && (
        <div className="mb-4 px-3.5 py-2.5 rounded-lg text-[13px] bg-[var(--color-danger-bg)] text-[var(--color-danger)]">
          {error ?? errorMessage}
        </div>
      )}

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
            placeholder="you@forgex.systems"
            {...register('email')}
            className={cn(
              'w-full h-[44px] px-3.5 rounded-xl text-[14px]',
              'border outline-none transition-colors duration-150',
              'bg-[var(--color-surface)] text-[var(--color-text-body)]',
              'placeholder:text-[var(--color-text-muted)]',
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

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="block text-[11px] font-medium tracking-[0.06em] uppercase text-[var(--color-text-secondary)]"
            >
              Password
            </label>
            <Link
              href={ROUTES.FORGOT_PASSWORD}
              className="text-[13px] font-medium transition-opacity hover:opacity-70 text-[var(--color-accent)]"
            >
              Forgot password?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
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

        <Button
          type="submit"
          variant="primary"
          size="lg"
          loading={isLoading}
          className="w-full rounded-xl mt-2"
        >
          Sign in
        </Button>
      </form>

      <AuthDivider />

      <GoogleButton onClick={handleGoogle} loading={isGoogleLoading} />

      <p className="mt-5 text-center text-[13px] text-[var(--color-text-muted)]">
        Access is invite-only. Contact your admin if you need an account.
      </p>
    </AuthCard>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <AuthCard>
          <div className="flex justify-center py-16">
            <div className="w-6 h-6 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          </div>
        </AuthCard>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
