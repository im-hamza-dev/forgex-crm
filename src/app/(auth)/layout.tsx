import type { Metadata } from 'next'
import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Sign in',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      <div className="min-h-dvh w-full flex items-center justify-center px-4 py-8 sm:py-12 bg-[var(--color-page)]">
        <div className="w-full max-w-[420px]">{children}</div>
        <Toaster />
      </div>
    </Providers>
  )
}
