import { NextResponse } from 'next/server'

export const dynamic = 'force-static'

export async function GET() {
  const manifest = {
    id: '/portal',
    name: 'Forgex Client Portal',
    short_name: 'Portal',
    description:
      'Track your project progress, view updates, and communicate with the Forgex team.',
    start_url: '/portal',
    scope: '/portal/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#9c6644',
    theme_color: '#9c6644',
    lang: 'en',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
        purpose: 'any',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
      {
        src: '/apple-touch-icon.png',
        sizes: '180x180',
        type: 'image/png',
        purpose: 'any',
      },
    ],
  }

  return new NextResponse(JSON.stringify(manifest), {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
