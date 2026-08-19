'use client'

import { Plus } from 'lucide-react'

interface PortalRaiseButtonProps {
  onClick: () => void
}

export function PortalRaiseButton({ onClick }: PortalRaiseButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Raise a Request"
      className="fixed bottom-5 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center justify-center gap-2 h-12 w-12 sm:w-auto sm:px-5 rounded-full text-[14px] font-semibold text-white transition-all hover:opacity-90 active:scale-[0.97] mb-[env(safe-area-inset-bottom)]"
      style={{
        background: 'var(--color-accent)',
        boxShadow: '0 4px 16px rgba(156,102,68,0.35)',
      }}
    >
      <Plus size={18} />
      <span className="hidden sm:inline">Raise a Request</span>
    </button>
  )
}
