// Service Worker — Forgex Client Portal
// IMPORTANT: Never cache API routes or dynamic data

const CACHE_NAME = 'forgex-portal-static-v1'

// Only cache these specific static assets
const STATIC_ASSETS = [
  '/favicon.png',
  '/icon-192.png',
  '/icon-512.png',
  '/apple-touch-icon.png',
]

// Install — cache only static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS)),
  )
  // Activate immediately — don't wait for old SW to die
  self.skipWaiting()
})

// Activate — clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      ),
    ),
  )
  self.clients.claim()
})

// Fetch — NETWORK FIRST for everything except static assets
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url)

  // NEVER intercept these — always go to network
  const skipPatterns = [
    '/api/',
    '/auth/',
    'supabase.co',
    '_next/data',
    '_next/static/chunks',
  ]

  const shouldSkip = skipPatterns.some(
    (pattern) =>
      url.pathname.includes(pattern) || url.hostname.includes(pattern),
  )

  if (shouldSkip) {
    return
  }

  // For static image assets only — cache first
  if (
    STATIC_ASSETS.includes(url.pathname) ||
    url.pathname.match(/\.(png|ico|svg|webp|jpg|jpeg)$/)
  ) {
    event.respondWith(
      caches.match(event.request).then((cached) => cached ?? fetch(event.request)),
    )
    return
  }

  // Everything else — network only, no caching
})
