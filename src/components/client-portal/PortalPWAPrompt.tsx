'use client'

import { useState, useEffect } from 'react'
import { X, Download } from 'lucide-react'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export function PortalPWAPrompt() {
  const [installPrompt, setInstallPrompt] =
    useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) return

    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
    if (!isMobile) return

    const wasDismissed = sessionStorage.getItem('pwa-prompt-dismissed')
    if (wasDismissed) return

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
      setTimeout(() => setShowPrompt(true), 3000)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstall)
    return () =>
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') {
      setShowPrompt(false)
      setInstallPrompt(null)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    setDismissed(true)
    sessionStorage.setItem('pwa-prompt-dismissed', '1')
  }

  if (!showPrompt || dismissed) return null

  return (
    <div
      className="fixed bottom-24 left-4 right-4 z-[500] mx-auto max-w-[400px]"
      role="alert"
      aria-live="polite"
    >
      <div
        className="flex items-center gap-3 rounded-2xl px-4 py-3 shadow-xl"
        style={{
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          boxShadow: '0 8px 32px rgba(26,16,8,0.16)',
        }}
      >
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: '#9c6644' }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/icon-192.png"
            alt="Forgex"
            className="w-7 h-7 rounded-lg"
          />
        </div>

        <div className="flex-1 min-w-0">
          <p
            className="text-[13px] font-semibold leading-tight"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Add to home screen
          </p>
          <p
            className="text-[11px] mt-0.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Access your portal like an app
          </p>
        </div>

        <button
          type="button"
          onClick={() => void handleInstall()}
          className="flex items-center gap-1.5 h-[32px] px-3 rounded-lg text-[12px] font-semibold text-white shrink-0 transition-opacity hover:opacity-90"
          style={{ background: '#9c6644' }}
        >
          <Download size={12} />
          Install
        </button>

        <button
          type="button"
          onClick={handleDismiss}
          className="flex items-center justify-center w-6 h-6 rounded-lg shrink-0 hover:bg-[var(--color-surface-hover)]"
          style={{ color: 'var(--color-text-muted)' }}
          aria-label="Dismiss"
        >
          <X size={13} />
        </button>
      </div>
    </div>
  )
}
