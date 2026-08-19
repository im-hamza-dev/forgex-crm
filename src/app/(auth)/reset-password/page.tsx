'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, AuthWordmark, Button } from '@/components/ui'
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

type PageState = 'checking' | 'ready' | 'no_session' | 'success'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('checking')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const supabase = createClient()

    void (async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        setPageState('no_session')
        return
      }

      setPageState('ready')
    })()
  }, [])

  const onSubmit = async (values: Values) => {
    setIsLoading(true)
    setError('')
    try {
      const supabase = createClient()

      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      })

      if (updateError) {
        setError(updateError.message)
        return
      }

      await supabase.auth.signOut()
      setPageState('success')

      setTimeout(() => {
        router.push(ROUTES.LOGIN)
      }, 2500)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthWordmark />

      {pageState === 'checking' && (
        <div className="flex items-center justify-center py-8">
          <span className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
      )}

      {pageState === 'no_session' && (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-danger-bg)' }}
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ color: 'var(--color-danger)' }}
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>
          <div>
            <h1
              className="text-[20px] font-bold mb-1"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Link expired or invalid
            </h1>
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              This password reset link has expired or already been used. Request
              a new one from the login page.
            </p>
          </div>
          <a
            href={ROUTES.FORGOT_PASSWORD}
            className="h-[44px] w-full flex items-center justify-center rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
            style={{ background: 'var(--color-accent)' }}
          >
            Request new link
          </a>
          <a
            href={ROUTES.LOGIN}
            className="text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Back to login
          </a>
        </div>
      )}

      {pageState === 'success' && (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ background: 'var(--color-success-bg)' }}
          >
            <ShieldCheck size={22} style={{ color: 'var(--color-success)' }} />
          </div>
          <div>
            <h1
              className="text-[20px] font-bold mb-1"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Password updated
            </h1>
            <p
              className="text-[14px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Your password has been changed. Redirecting you to login...
            </p>
          </div>
          <span className="w-4 h-4 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
      )}

      {pageState === 'ready' && (
        <>
          <div className="mb-6">
            <h1
              className="text-[22px] font-bold mb-1"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Set new password
            </h1>
            <p
              className="text-[14px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              Choose a strong password for your account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <label
                className="block text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoFocus
                  {...register('password')}
                  placeholder="Min. 8 characters"
                  className={cn(
                    'w-full h-[44px] px-3.5 pr-11 rounded-xl text-[14px] border outline-none transition-colors',
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
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                  style={{ color: 'var(--color-text-muted)' }}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              {errors.password && (
                <p
                  className="text-[12px]"
                  style={{ color: 'var(--color-danger)' }}
                >
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label
                className="block text-[11px] font-semibold uppercase tracking-[0.06em]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                Confirm Password
              </label>
              <input
                type={showPassword ? 'text' : 'password'}
                {...register('confirm')}
                placeholder="Repeat new password"
                className={cn(
                  'w-full h-[44px] px-3.5 rounded-xl text-[14px] border outline-none transition-colors',
                  errors.confirm
                    ? 'border-[var(--color-danger)]'
                    : 'border-[var(--color-border)] focus:border-[var(--color-accent)]',
                )}
                style={{
                  background: 'var(--color-surface)',
                  color: 'var(--color-text-body)',
                }}
              />
              {errors.confirm && (
                <p
                  className="text-[12px]"
                  style={{ color: 'var(--color-danger)' }}
                >
                  {errors.confirm.message}
                </p>
              )}
            </div>

            {error && (
              <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
                {error}
              </p>
            )}

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full rounded-xl"
            >
              Update Password
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  )
}
