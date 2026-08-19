'use client'

import { useEffect } from 'react'

export function PortalSWRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV === 'production' &&
      'serviceWorker' in navigator
    ) {
      const onLoad = () => {
        navigator.serviceWorker
          .register('/sw.js', { scope: '/' })
          .then((reg) => {
            console.log('[PWA] Service worker registered', reg.scope)

            setInterval(() => {
              void reg.update()
            }, 60_000)
          })
          .catch((err: unknown) => {
            console.error('[PWA] Service worker registration failed:', err)
          })
      }

      window.addEventListener('load', onLoad)
      if (document.readyState === 'complete') onLoad()

      return () => window.removeEventListener('load', onLoad)
    }
  }, [])

  return null
}
