'use client'

import { useState } from 'react'
import { Eye, EyeOff, ChevronLeft } from 'lucide-react'
import { toast } from '@/components/ui'

interface PortalSettingsPageProps {
  clientName: string
  clientInitials: string
  clientEmail: string
  clientCompany: string
  onBack: () => void
  onSaveProfile?: (fullName: string) => Promise<void>
  onChangePassword?: (current: string, newPw: string) => Promise<void>
  onSignOut?: () => void
}

export function PortalSettingsPage({
  clientName,
  clientInitials,
  clientEmail,
  clientCompany,
  onBack,
  onSaveProfile,
  onChangePassword,
  onSignOut,
}: PortalSettingsPageProps) {
  const [fullName, setFullName] = useState(clientName)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      await onSaveProfile?.(fullName)
    } finally {
      setSaving(false)
    }
  }

  const inputStyle = {
    background: 'var(--color-surface)',
    color: 'var(--color-text-body)',
    borderColor: 'var(--color-border)',
  }

  const disabledStyle = {
    background: 'var(--color-surface-hover)',
    color: 'var(--color-text-muted)',
    borderColor: 'var(--color-border)',
  }

  return (
    <div className="max-w-[640px] mx-auto">
      <button
        type="button"
        onClick={onBack}
        className="flex items-center gap-1.5 text-[13px] font-medium mb-5 hover:opacity-70 transition-opacity"
        style={{ color: 'var(--color-accent)' }}
      >
        <ChevronLeft size={15} />
        Back to Project
      </button>

      <h1
        className="text-[24px] font-bold mb-6"
        style={{ color: 'var(--color-text-heading)', letterSpacing: '-0.02em' }}
      >
        Account Settings
      </h1>

      <div
        className="rounded-xl border p-4 sm:p-6 mb-4"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <h2
          className="text-[15px] font-semibold mb-5"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Profile
        </h2>

        <div className="flex flex-col items-start gap-1 mb-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center text-[20px] font-bold text-white"
            style={{ background: 'var(--color-accent)' }}
          >
            {clientInitials}
          </div>
          <button
            type="button"
            className="text-[12px] font-medium mt-1 hover:opacity-70 transition-opacity"
            style={{ color: 'var(--color-accent)' }}
          >
            Change photo
          </button>
          <p className="text-[15px] font-bold mt-1" style={{ color: 'var(--color-text-heading)' }}>
            {clientName}
          </p>
          <p className="text-[13px]" style={{ color: 'var(--color-text-secondary)' }}>
            {clientCompany}
          </p>
          <p className="text-[13px]" style={{ color: 'var(--color-text-muted)' }}>
            {clientEmail}
          </p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Full Name
            </label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none transition-colors focus:border-[var(--color-accent)]"
              style={inputStyle}
            />
          </div>

          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Email
            </label>
            <input
              type="email"
              value={clientEmail}
              disabled
              className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none cursor-not-allowed"
              style={disabledStyle}
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Contact Forgex to update your email
            </p>
          </div>

          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Company
            </label>
            <input
              type="text"
              value={clientCompany}
              disabled
              className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none cursor-not-allowed"
              style={disabledStyle}
            />
            <p className="text-[11px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
              Managed by Forgex
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={saving}
          className="mt-5 w-full sm:w-auto h-[40px] px-6 rounded-lg text-[13px] font-semibold text-white disabled:opacity-60 transition-colors hover:opacity-90"
          style={{ background: 'var(--color-accent)' }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>

      <div
        className="rounded-xl border p-4 sm:p-6"
        style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
      >
        <h2
          className="text-[15px] font-semibold mb-5"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Security
        </h2>

        <div className="flex flex-col gap-4">
          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Current Password
            </label>
            <div className="relative">
              <input
                type={showCurrentPw ? 'text' : 'password'}
                value={currentPw}
                onChange={(e) => setCurrentPw(e.target.value)}
                className="w-full h-[40px] px-3 pr-10 rounded-lg text-[13px] border outline-none transition-colors focus:border-[var(--color-accent)]"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowCurrentPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showCurrentPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              New Password
            </label>
            <div className="relative">
              <input
                type={showNewPw ? 'text' : 'password'}
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full h-[40px] px-3 pr-10 rounded-lg text-[13px] border outline-none transition-colors focus:border-[var(--color-accent)]"
                style={inputStyle}
              />
              <button
                type="button"
                onClick={() => setShowNewPw((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 hover:opacity-70"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {showNewPw ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          <div>
            <label
              className="block text-[10px] font-semibold uppercase tracking-[0.06em] mb-1.5"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPw}
              onChange={(e) => setConfirmPw(e.target.value)}
              className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none transition-colors focus:border-[var(--color-accent)]"
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            disabled={!currentPw || !newPw || !confirmPw}
            onClick={() => {
              void (async () => {
                if (!currentPw || !newPw || !confirmPw) return
                if (newPw !== confirmPw) {
                  toast.error('Passwords do not match')
                  return
                }
                await onChangePassword?.(currentPw, newPw)
                setCurrentPw('')
                setNewPw('')
                setConfirmPw('')
              })()
            }}
            className="h-[40px] px-5 rounded-lg text-[13px] font-medium border transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-40 w-fit"
            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-body)' }}
          >
            Update Password
          </button>

          <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '16px' }}>
            <button
              type="button"
              onClick={() => onSignOut?.()}
              className="text-[13px] font-medium hover:opacity-70 transition-opacity"
              style={{ color: 'var(--color-danger)' }}
            >
              Sign out
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
