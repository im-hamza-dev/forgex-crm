import type { Metadata } from 'next'
import { inter } from '@/lib/fonts'
import { Toaster } from '@/components/ui'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Forgex CRM',
    template: '%s | Forgex CRM',
  },
  description: 'Internal CRM for Forgex Systems',
  robots: { index: false, follow: false },
  verification: {
    google: 'QmCIj17LRMCrEv8ivpF21gW3U6RzXuobdaP6ndSU6Lo',
  },
  icons: {
    icon: '/favicon.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="font-inter antialiased">
        {children}
        <Toaster />
      </body>
    </html>
  )
}
