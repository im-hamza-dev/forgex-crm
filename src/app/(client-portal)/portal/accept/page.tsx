'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
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
type PageState = 'checking' | 'ready' | 'expired' | 'success' | 'error'

export default function PortalAcceptPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('checking')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [clientName, setClientName] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({
    resolver: zodResolver(schema),
  })

  useEffect(() => {
    const supabase = createClient()

    void (async () => {
      const hash = window.location.hash
      const params = new URLSearchParams(hash.substring(1))

      const errorCode = params.get('error_code')
      const errorParam = params.get('error')
      const errorDescription = params.get('error_description')

      if (errorParam || errorCode) {
        if (
          errorCode === 'otp_expired' ||
          errorDescription?.includes('expired') ||
          errorDescription?.includes('invalid')
        ) {
          setPageState('expired')
        } else {
          setError(errorDescription?.replace(/\+/g, ' ') ?? 'Invalid invite link')
          setPageState('error')
        }
        return
      }

      const accessToken = params.get('access_token')
      const refreshToken = params.get('refresh_token')

      if (accessToken && refreshToken) {
        const { data, error: sessionError } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (sessionError || !data.user) {
          setPageState('expired')
          return
        }

        const name = data.user.user_metadata?.full_name
        const pid = data.user.user_metadata?.project_id

        if (typeof name === 'string') setClientName(name)
        if (typeof pid === 'string') setProjectId(pid)

        if (!pid) {
          const { data: account } = await supabase
            .from('client_accounts')
            .select('project_id')
            .eq('auth_user_id', data.user.id)
            .maybeSingle()

          if (account?.project_id) {
            setProjectId(account.project_id)
          }
        }

        window.history.replaceState(null, '', window.location.pathname)
        setPageState('ready')
        return
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.full_name
        if (typeof name === 'string') setClientName(name)

        const { data: account } = await supabase
          .from('client_accounts')
          .select('project_id')
          .eq('auth_user_id', user.id)
          .maybeSingle()

        if (account?.project_id) setProjectId(account.project_id)
        setPageState('ready')
        return
      }

      setPageState('expired')
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

      // Activate via server API (bypasses RLS)
      const activateRes = await fetch('/api/portal/activate', { method: 'POST' })
      const activateData = (await activateRes.json()) as {
        success?: boolean
        project_id?: string
        error?: string
      }

      if (!activateRes.ok) {
        setError(activateData.error ?? 'Could not activate your account. Please try again.')
        return
      }

      const resolvedProjectId = activateData.project_id ?? projectId

      setPageState('success')

      setTimeout(() => {
        if (resolvedProjectId) {
          router.push(`/portal/${resolvedProjectId}`)
        } else {
          router.push('/portal')
        }
      }, 2000)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const firstName = clientName.split(' ')[0]

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'var(--color-page)' }}
    >
      <div
        className="w-full max-w-[420px] rounded-2xl border p-5 sm:p-8"
        style={{
          background: 'var(--color-surface)',
          borderColor: 'var(--color-border)',
          boxShadow: '0 4px 24px rgba(26,16,8,0.08)',
        }}
      >
        <div className="flex items-center gap-0 mb-8">
          <span
            className="text-[20px] font-bold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Forgex
          </span>
          <span
            className="text-[20px] font-bold"
            style={{ color: 'var(--color-accent)' }}
          >
            .systems
          </span>
        </div>

        {pageState === 'checking' && (
          <div className="flex items-center justify-center py-8">
            <span className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
          </div>
        )}

        {(pageState === 'expired' || pageState === 'error') && (
          <div className="flex flex-col items-center text-center gap-4">
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
                className="text-[20px] font-bold mb-2"
                style={{ color: 'var(--color-text-heading)' }}
              >
                {pageState === 'expired' ? 'Invite link expired' : 'Invalid invite link'}
              </h1>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                {pageState === 'expired'
                  ? 'This invite link has expired or already been used. Contact Forgex to request a new invite.'
                  : error || 'This invite link is invalid. Please contact Forgex.'}
              </p>
            </div>
            <a
              href="/login"
              className="text-[13px] font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-accent)' }}
            >
              Back to login
            </a>
          </div>
        )}

        {pageState === 'success' && (
          <div className="flex flex-col items-center text-center gap-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center"
              style={{ background: '#EDF5ED' }}
            >
              <ShieldCheck size={22} style={{ color: '#2D6A2D' }} />
            </div>
            <div>
              <h1
                className="text-[20px] font-bold mb-2"
                style={{ color: 'var(--color-text-heading)' }}
              >
                Welcome aboard!
              </h1>
              <p
                className="text-[14px]"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Your account is ready. Taking you to your project portal...
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
                {firstName ? `Welcome, ${firstName}!` : 'Welcome!'}
              </h1>
              <p
                className="text-[14px] leading-relaxed"
                style={{ color: 'var(--color-text-secondary)' }}
              >
                Set a password to access your project portal.
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Password
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70"
                    style={{ color: 'var(--color-text-muted)' }}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-[12px] mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Confirm Password
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  {...register('confirm')}
                  placeholder="Repeat your password"
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
                  <p className="text-[12px] mt-1" style={{ color: 'var(--color-danger)' }}>
                    {errors.confirm.message}
                  </p>
                )}
              </div>

              {error && (
                <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[44px] rounded-xl text-[14px] font-semibold text-white transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2"
                style={{ background: 'var(--color-accent)' }}
              >
                {isLoading && (
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                Access my portal
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
