import { Providers } from '@/components/providers'
import { Toaster } from '@/components/ui'

// DashboardShell is used per-page (each page has its own title).
// Layout only provides providers and toaster.

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      {children}
      <Toaster />
    </Providers>
  )
}
