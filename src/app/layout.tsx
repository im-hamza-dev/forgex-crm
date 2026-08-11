import type { Metadata } from 'next'
import { inter } from '@/lib/fonts'
import '@/app/globals.css'

export const metadata: Metadata = {
  title: 'Forgex CRM',
  description: 'Internal CRM for Forgex Systems',
  robots: { index: false, follow: false }, // never index the CRM
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
      </body>
    </html>
  )
}
