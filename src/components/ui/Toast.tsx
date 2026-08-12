'use client'

import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'

// Re-export the provider — add <Toaster /> to root layout
export function Toaster() {
  return (
    <SonnerToaster
      position="bottom-right"
      gap={8}
      toastOptions={{
        style: {
          background: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
          color: 'var(--color-text-body)',
          fontFamily: 'var(--font-inter)',
          fontSize: '14px',
          borderRadius: '10px',
          padding: '12px 16px',
          boxShadow: '0 4px 16px rgba(26,16,8,0.10)',
        },
      }}
    />
  )
}

// Typed toast helpers — import these in feature code
export const toast = {
  success: (message: string, description?: string) =>
    sonnerToast.success(message, { description }),
  error: (message: string, description?: string) =>
    sonnerToast.error(message, { description }),
  warning: (message: string, description?: string) =>
    sonnerToast.warning(message, { description }),
  info: (message: string, description?: string) =>
    sonnerToast.info(message, { description }),
}
