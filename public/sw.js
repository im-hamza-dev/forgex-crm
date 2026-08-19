const CACHE_NAME = 'forgex-portal-v1'

const STATIC_ASSETS = [
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // Never intercept these
  const skipPatterns = [
    '/api/',
    'supabase.co',
    '_next/data',
  ]

  const shouldSkip = skipPatterns.some(
    (p) => url.pathname.includes(p) || url.hostname.includes(p)
  )

  if (shouldSkip) return

  // Cache static icons only
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(event.request).then(
        (cached) => cached ?? fetch(event.request)
      )
    )
  }
})
