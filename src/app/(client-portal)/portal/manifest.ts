import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/portal',
    name: 'Forgex Client Portal',
    short_name: 'Portal',
    description:
      'Track your project progress, view updates, and communicate with the Forgex team.',
    start_url: '/portal',
    scope: '/portal',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: '#9c6644',
    theme_color: '#9c6644',
    lang: 'en',
    dir: 'ltr',
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
}
