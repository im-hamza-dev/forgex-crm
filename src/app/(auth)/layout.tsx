import type { Metadata } from 'next'
import { Toaster } from '@/components/ui'

export const metadata: Metadata = {
  title: 'Forgex CRM',
  robots: { index: false, follow: false },
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-[var(--color-page)]">
      <div className="w-full max-w-[420px]">
        {children}
      </div>
      <Toaster />
    </div>
  )
}
