import type { Metadata, Viewport } from 'next'
import { Providers } from '@/components/providers'
import { PortalSWRegister } from '@/components/client-portal/PortalSWRegister'

export const viewport: Viewport = {
  themeColor: '#9c6644',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export const metadata: Metadata = {
  title: {
    default: 'Project Portal | Forgex Systems',
    template: '%s | Forgex Systems',
  },
  description:
    'Track your project progress, view files, and communicate with the Forgex team.',
  manifest: '/portal/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Forgex Portal',
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
    shortcut: '/favicon.png',
  },
}

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <Providers>
      {children}
      <PortalSWRegister />
    </Providers>
  )
}
