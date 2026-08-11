import { Inter } from 'next/font/google'

export const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

// General Sans: add here when licensed
// For now font-display falls back to Inter
export const fontDisplay = inter
