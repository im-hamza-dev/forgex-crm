import type { Metadata } from 'next'
import { inter } from '@/lib/fonts'
import { Toaster } from '@/components/ui'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: {
    default: 'Forgex CRM',
    template: '%s | Forgex CRM',
  },
  description:
    'Client relationship management for Forgex Systems — manage leads, projects, tasks, and client communications in one place.',
  keywords: ['CRM', 'project management', 'leads', 'client portal', 'Forgex'],
  authors: [{ name: 'Forgex Systems', url: 'https://forgex.systems' }],
  creator: 'Forgex Systems',
  robots: { index: false, follow: false },
  icons: {
    icon: [
      { url: '/favicon.png', type: 'image/png' },
      { url: '/favicon.ico', sizes: '32x32' },
    ],
    apple: [{ url: '/apple-touch-icon.png', sizes: '180x180' }],
    shortcut: '/favicon.png',
  },
  manifest: '/manifest.json',
  openGraph: {
    title: 'Forgex CRM',
    description: 'Client relationship management for Forgex Systems',
    siteName: 'Forgex CRM',
    locale: 'en_US',
    type: 'website',
  },
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
