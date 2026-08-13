'use client'
import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff } from 'lucide-react'
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

export default function PortalAcceptPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [userName, setUserName] = useState('')
  const [projectId, setProjectId] = useState<string | null>(null)
  const [error, setError] = useState('')

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<Values>({ resolver: zodResolver(schema) })

  useEffect(() => {
    const supabase = createClient()
    void (async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return
      const name = user.user_metadata?.full_name
      if (typeof name === 'string') setUserName(name)
      const metaProjectId = user.user_metadata?.project_id
      if (typeof metaProjectId === 'string') {
        setProjectId(metaProjectId)
        return
      }
      const { data: account } = await supabase
        .from('client_accounts')
        .select('project_id')
        .eq('auth_user_id', user.id)
        .maybeSingle()
      if (account?.project_id) setProjectId(account.project_id)
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
      const { data: { user } } = await supabase.auth.getUser()
      let nextProjectId = projectId
      if (user && !nextProjectId) {
        const { data: account } = await supabase
          .from('client_accounts')
          .select('id, project_id')
          .eq('email', user.email ?? '')
          .maybeSingle()
        if (account) {
          await supabase
            .from('client_accounts')
            .update({ auth_user_id: user.id, status: 'active' })
            .eq('id', account.id)
          nextProjectId = account.project_id
        }
      }
      if (nextProjectId) {
        window.location.href = ROUTES.PORTAL_PROJECT(nextProjectId)
      } else {
        setError('No project linked to this invite. Contact your account manager.')
      }
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <AuthCard>
      <AuthWordmark />
      <div className="mb-6">
        <h1
          className="text-[22px] font-bold mb-1"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Accept portal invitation
        </h1>
        <p
          className="text-[14px]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {userName ? `Welcome, ${userName}. ` : ''}Set your password to
          access your project portal.
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
            <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
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
            <p className="text-[12px]" style={{ color: 'var(--color-danger)' }}>
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
          Set password & enter portal
        </Button>
      </form>
    </AuthCard>
  )
}
