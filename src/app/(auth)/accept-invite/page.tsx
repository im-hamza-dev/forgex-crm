'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { AuthCard, AuthWordmark, Button } from '@/components/ui'
import { ROUTES } from '@/constants/routes'
import { ROLES, type TeamRole } from '@/constants/roles'
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

function isTeamRole(value: unknown): value is TeamRole {
  return value === ROLES.ADMIN || value === ROLES.MANAGER || value === ROLES.MEMBER
}

export default function AcceptInvitePage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const [error, setError] = useState('')
  const [linkStatus, setLinkStatus] = useState<
    'checking' | 'valid' | 'expired' | 'error'
  >('checking')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

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
          setLinkStatus('expired')
        } else {
          setError(errorDescription?.replace(/\+/g, ' ') ?? 'Invalid invite link')
          setLinkStatus('error')
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
        if (sessionError) {
          setLinkStatus('expired')
          return
        }
        if (data.user) {
          const name = data.user.user_metadata?.full_name
          if (typeof name === 'string') setUserName(name)
          window.history.replaceState(null, '', window.location.pathname)
          setLinkStatus('valid')
          return
        }
      }

      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const name = user.user_metadata?.full_name
        if (typeof name === 'string') setUserName(name)
        setLinkStatus('valid')
        return
      }

      setLinkStatus('expired')
    })()
  }, [])

  const onSubmit = async (values: Values) => {
    setIsLoading(true)
    setError('')
    try {
      const supabase = createClient()
      // Verify session exists before trying to set password
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) {
        setError('Session expired. Please click the invite link again.')
        return
      }

      const { error: updateError } = await supabase.auth.updateUser({
        password: values.password,
      })
      if (updateError) {
        setError(updateError.message)
        return
      }
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const invitedRole = user.user_metadata?.invited_role
        if (isTeamRole(invitedRole)) {
          await supabase
            .from('profiles')
            .update({ role: invitedRole })
            .eq('id', user.id)
        }
      }
      window.location.href = ROUTES.DASHBOARD
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthWordmark />

      {linkStatus === 'checking' && (
        <div className="flex items-center justify-center py-8">
          <span className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
      )}

      {(linkStatus === 'expired' || linkStatus === 'error') && (
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
              {linkStatus === 'expired'
                ? 'Invite link expired'
                : 'Invalid invite link'}
            </h1>
            <p
              className="text-[14px] leading-relaxed"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {linkStatus === 'expired'
                ? 'This invite link has expired or already been used. Ask your admin to send a new invite.'
                : error ||
                  'This invite link is invalid. Please contact your admin.'}
            </p>
          </div>
          <a
            href="/login"
            className="text-[13px] font-medium transition-opacity hover:opacity-70"
            style={{ color: 'var(--color-accent)' }}
          >
            Back to login
          </a>
        </div>
      )}

      {linkStatus === 'valid' && (
        <>
          <div className="mb-6">
            <h1
              className="text-[22px] font-bold mb-1"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Accept invitation
            </h1>
            <p
              className="text-[14px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              {userName ? `Welcome, ${userName}. ` : ''}Set your password to get
              started.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  autoFocus
                  {...register('password')}
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
              Set password & enter workspace
            </Button>
          </form>
        </>
      )}
    </AuthCard>
  )
}
