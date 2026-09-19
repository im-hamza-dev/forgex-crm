import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { inter } from '@/lib/fonts'
import { Toaster } from '@/components/ui'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { parseTheme, THEME_STORAGE_KEY } from '@/lib/theme'
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

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const cookieStore = await cookies()
  const initialTheme = parseTheme(cookieStore.get(THEME_STORAGE_KEY)?.value) ?? 'light'

  return (
    <html
      lang="en"
      className={inter.variable}
      data-theme={initialTheme}
      style={{ colorScheme: initialTheme }}
      suppressHydrationWarning
    >
      <body className="font-inter antialiased">
        <ThemeProvider initialTheme={initialTheme}>
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  )
}
