'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { AuthWordmark, AuthDivider, GoogleButton, Button } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { ROUTES } from '@/constants/routes'
import { cn } from '@/lib/utils'

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required'),
})
type LoginValues = z.infer<typeof loginSchema>

const AMBERS = ['#9c6644','#b07d46','#c08a3e','#7a5228','#d4a462','#875e32']
const SHADOWS = ['#c4b89a','#b5a888','#a89878','#d4c8ae','#bfb090']
const QUOTES = [
  'Build what matters.',
  'Every deal starts with trust.',
  'Close with confidence.',
  'Forge your path forward.',
  'Revenue follows clarity.',
]

function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

interface LetterData {
  ch: string
  sx: number; sy: number
  tx: number; ty: number
  rx: number; ry: number
  fontSize: number
  color: string; shadowCol: string
  shadowLen: number; shadowSteps: number
  vx: number; vy: number
  bouncePhase: number; bounceAmp: number; bounceFreq: number
  scatterTilt: number; tilt: number
  opacity: number; age: number
}

function LetterCanvas({ hovered }: { hovered: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const lettersRef = useRef<LetterData[]>([])
  const rafRef = useRef<number>(0)
  const lastTsRef = useRef<number | null>(null)
  const hoveredRef = useRef(hovered)

  useEffect(() => { hoveredRef.current = hovered }, [hovered])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const buildLetters = () => {
      const ctx = canvas.getContext('2d')!
      const W = canvas.width
      const H = canvas.height
      const FS = 38
      ctx.font = `700 ${FS}px Georgia,'Times New Roman',serif`
      const rowCount = QUOTES.length
      const totalTextH = rowCount * 56
      const startY = (H - totalTextH) / 2 + 42
      const LEFT_X = 52
      lettersRef.current = []
      QUOTES.forEach((quote, qi) => {
        const lineY = startY + qi * 56
        let cx = LEFT_X
        quote.split('').forEach((ch) => {
          const cw = ctx.measureText(ch).width
          if (ch === ' ') { cx += cw; return }
          lettersRef.current.push({
            ch,
            sx: 60 + Math.random() * (W - 120),
            sy: 60 + Math.random() * (H - 120),
            tx: cx + cw * 0.5,
            ty: lineY,
            rx: 60 + Math.random() * (W - 120),
            ry: 60 + Math.random() * (H - 120),
            fontSize: FS,
            color: AMBERS[Math.floor(Math.random() * AMBERS.length)]!,
            shadowCol: SHADOWS[Math.floor(Math.random() * SHADOWS.length)]!,
            shadowLen: 4 + Math.random() * 9,
            shadowSteps: 9 + Math.floor(Math.random() * 5),
            vx: (Math.random() - 0.5) * 0.055,
            vy: (Math.random() - 0.5) * 0.038,
            bouncePhase: Math.random() * Math.PI * 2,
            bounceAmp: 5 + Math.random() * 7,
            bounceFreq: 0.0016 + Math.random() * 0.001,
            scatterTilt: (Math.random() - 0.5) * 0.42,
            tilt: (Math.random() - 0.5) * 0.42,
            opacity: 0.62 + Math.random() * 0.22,
            age: Math.random() * 8000,
          })
          cx += cw
        })
      })
    }

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      buildLetters()
    }

    resize()
    window.addEventListener('resize', resize)

    const frame = (ts: number) => {
      if (!lastTsRef.current) lastTsRef.current = ts
      const dt = Math.min(ts - lastTsRef.current, 40)
      lastTsRef.current = ts
      const ctx = canvas.getContext('2d')!
      const isHov = hoveredRef.current
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      lettersRef.current.forEach((l) => {
        l.age += dt
        if (isHov) {
          const sp = 0.009 * dt
          l.rx = lerp(l.rx, l.tx, sp)
          const bounce = Math.sin(l.age * l.bounceFreq + l.bouncePhase) * l.bounceAmp * 0.35
          l.ry = lerp(l.ry, l.ty + bounce, sp)
          l.tilt = lerp(l.tilt, 0, sp)
          l.sx += l.vx * dt; l.sy += l.vy * dt
        } else {
          l.sx += l.vx * dt; l.sy += l.vy * dt
          const W = canvas.width, H = canvas.height
          if (l.sx < -80) l.sx = W + 50
          if (l.sx > W + 80) l.sx = -50
          if (l.sy < 20) l.sy = H - 30
          if (l.sy > H + 20) l.sy = 30
          const bounce = Math.abs(Math.sin(l.age * l.bounceFreq + l.bouncePhase)) * l.bounceAmp
          l.rx = lerp(l.rx, l.sx, 0.007 * dt)
          l.ry = lerp(l.ry, l.sy - bounce, 0.007 * dt)
          l.tilt = lerp(l.tilt, l.scatterTilt + Math.sin(l.age * 0.0003) * 0.08, 0.004 * dt)
        }

        ctx.save()
        ctx.translate(l.rx, l.ry)
        ctx.rotate(l.tilt)
        ctx.font = `700 ${l.fontSize}px Georgia,'Times New Roman',serif`
        ctx.textBaseline = 'alphabetic'
        for (let i = l.shadowSteps; i >= 1; i--) {
          const r = i / l.shadowSteps
          ctx.globalAlpha = (1 - r) * 0.17 * l.opacity
          ctx.fillStyle = l.shadowCol
          ctx.fillText(l.ch, i * l.shadowLen * 0.15, i * l.shadowLen * 0.22)
        }
        ctx.globalAlpha = l.opacity
        ctx.fillStyle = l.color
        ctx.fillText(l.ch, 0, 0)
        ctx.globalAlpha = l.opacity * 0.18
        ctx.fillStyle = 'rgba(255,255,255,0.9)'
        ctx.fillText(l.ch, -0.7, -1.5)
        ctx.restore()
      })

      rafRef.current = requestAnimationFrame(frame)
    }

    rafRef.current = requestAnimationFrame(frame)

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full pointer-events-none z-0"
    />
  )
}

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
  const [hovered, setHovered] = useState(false)

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
      if (oauthError) setError(oauthError.message)
    } catch {
      setError('Google sign in failed. Please try again.')
    } finally {
      setIsGoogleLoading(false)
    }
  }

  return (
    <>
      {/* Full viewport background */}
      <div
        className="fixed inset-0 z-0"
        style={{
          background:
            'linear-gradient(135deg,#ede8e0 0%,#e4ddd2 40%,#f0ebe3 100%)',
        }}
      />

      {/* Canvas fills full viewport */}
      <LetterCanvas hovered={hovered} />

      {/* Hint */}
      <span
        className="fixed bottom-4 left-1/2 -translate-x-1/2 z-10 text-[11px] tracking-[0.04em] pointer-events-none whitespace-nowrap transition-opacity duration-500"
        style={{ color: '#b5a890', opacity: hovered ? 0 : 1 }}
      >
        hover to read · move away to scatter
      </span>

      {/* Full viewport hover detector + card centering */}
      <div
        className="fixed inset-0 z-10 flex items-center justify-center"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
      >
        {/* Card slides right on hover */}
        <div
          className="w-[340px] rounded-[22px] transition-transform duration-700 will-change-transform"
          style={{
            padding: '34px 30px 28px',
            background: '#fff',
            boxShadow:
              '0 2px 4px rgba(0,0,0,0.04),0 8px 24px rgba(0,0,0,0.09),0 24px 64px rgba(0,0,0,0.10)',
            border: '1px solid rgba(255,255,255,0.8)',
            transform: hovered
              ? 'translateX(clamp(100px, calc(50vw - 450px), 240px))'
              : 'translateX(0)',
          }}
        >
          <AuthWordmark />

          <div className="mb-5">
            <h1 className="text-[19px] font-bold leading-tight mb-1 text-[var(--color-text-heading)]">
              Sign in
            </h1>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              Welcome back to your workspace
            </p>
          </div>

          {!!(error || errorMessage) && (
            <div className="mb-4 px-3 py-2.5 rounded-lg text-[12px] bg-[var(--color-danger-bg)] text-[var(--color-danger)]">
              {error ?? errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-[15px]">
            <div>
              <label
                htmlFor="email"
                className="block text-[10px] font-semibold uppercase tracking-[0.07em] mb-1.5 text-[var(--color-text-muted)]"
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
                  'w-full h-[42px] px-3 rounded-[11px] text-[13px]',
                  'border outline-none transition-colors',
                  'placeholder:text-[var(--color-text-muted)]',
                  'text-[var(--color-text-body)]',
                  errors.email
                    ? 'border-[var(--color-danger)]'
                    : 'border-[#e5ddd4] focus:border-[var(--color-accent)]',
                )}
                style={{ background: '#f7f4f0' }}
              />
              {errors.email && (
                <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label
                  htmlFor="password"
                  className="block text-[10px] font-semibold uppercase tracking-[0.07em] text-[var(--color-text-muted)]"
                >
                  Password
                </label>
                <Link
                  href={ROUTES.FORGOT_PASSWORD}
                  className="text-[12px] font-medium text-[var(--color-accent)] hover:opacity-70 transition-opacity"
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
                    'w-full h-[42px] px-3 pr-10 rounded-[11px] text-[13px]',
                    'border outline-none transition-colors',
                    'text-[var(--color-text-body)]',
                    errors.password
                      ? 'border-[var(--color-danger)]'
                      : 'border-[#e5ddd4] focus:border-[var(--color-accent)]',
                  )}
                  style={{ background: '#f7f4f0' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-muted)] hover:opacity-70"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-[11px] text-[var(--color-danger)]">
                  {errors.password.message}
                </p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              size="lg"
              loading={isLoading}
              className="w-full rounded-[12px] mt-1"
            >
              Sign in
            </Button>
          </form>

          <AuthDivider />
          <GoogleButton onClick={handleGoogle} loading={isGoogleLoading} />

          <p className="mt-[14px] text-center text-[11px] leading-relaxed text-[var(--color-text-muted)]">
            Access is invite-only. Contact your admin
            <br />
            if you need an account.
          </p>
        </div>
      </div>
    </>
  )
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div
          className="fixed inset-0 flex items-center justify-center"
          style={{
            background:
              'linear-gradient(135deg,#ede8e0 0%,#e4ddd2 40%,#f0ebe3 100%)',
          }}
        >
          <div className="w-6 h-6 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
      }
    >
      <LoginForm />
    </Suspense>
  )
}
