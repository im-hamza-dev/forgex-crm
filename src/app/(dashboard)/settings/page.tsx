'use client'

import { useState, type InputHTMLAttributes, type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { DashboardShell } from '@/components/layout'
import { Avatar, Button } from '@/components/ui'

type SettingsSection = 'profile' | 'workspace' | 'notifications' | 'security'

const SETTINGS_NAV: { value: SettingsSection; label: string }[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'workspace', label: 'Workspace' },
  { value: 'notifications', label: 'Notifications' },
  { value: 'security', label: 'Security' },
]

function FieldLabel({ children }: { children: ReactNode }) {
  return (
    <label
      className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5"
      style={{ color: 'var(--color-text-muted)' }}
    >
      {children}
    </label>
  )
}

function SettingsInput({
  value,
  onChange,
  disabled,
  ...props
}: {
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <input
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full h-[40px] px-3 rounded-lg text-[13px]',
        'border outline-none transition-colors',
        disabled &&
          'opacity-60 cursor-not-allowed bg-[var(--color-surface-hover)]',
        !disabled &&
          'border-[var(--color-border)] focus:border-[var(--color-accent)]',
      )}
      style={{
        background: disabled
          ? 'var(--color-surface-hover)'
          : 'var(--color-surface)',
        color: 'var(--color-text-body)',
        borderColor: 'var(--color-border)',
      }}
      {...props}
    />
  )
}

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')
  const [fullName, setFullName] = useState('Hamza Iqbal')
  const [workspaceName, setWorkspaceName] = useState('Forgex Systems')

  return (
    <DashboardShell title="Settings" notificationCount={3}>
      <div className="flex gap-5 items-start">
        <div
          className="w-[185px] shrink-0 rounded-xl border bg-[var(--color-surface)] p-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {SETTINGS_NAV.map((item) => (
            <button
              type="button"
              key={item.value}
              onClick={() => setActiveSection(item.value)}
              className={cn(
                'w-full text-left px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors',
                activeSection === item.value
                  ? 'bg-[var(--color-accent-subtle)] text-[var(--color-accent)]'
                  : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div
          className="flex-1 rounded-xl border bg-[var(--color-surface)] p-6"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {activeSection === 'profile' && (
            <div>
              <h3
                className="text-[16px] font-bold mb-5"
                style={{ color: 'var(--color-text-heading)' }}
              >
                Profile
              </h3>

              <div className="flex items-center gap-4 mb-6">
                <Avatar name="Hamza Iqbal" size="lg" />
                <div>
                  <p
                    className="text-[16px] font-bold"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    Hamza Iqbal
                  </p>
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold mt-1 inline-block"
                    style={{
                      background: 'var(--color-accent-subtle)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    Admin
                  </span>
                </div>
              </div>

              <div className="mb-4">
                <FieldLabel>Full Name</FieldLabel>
                <SettingsInput value={fullName} onChange={setFullName} />
              </div>

              <div className="mb-6">
                <FieldLabel>Email</FieldLabel>
                <SettingsInput value="hamza@forgex.systems" disabled />
                <p
                  className="mt-1 text-[12px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Contact admin to change
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                onClick={() => console.log('Save changes')}
              >
                Save Changes
              </Button>
            </div>
          )}

          {activeSection === 'workspace' && (
            <div>
              <h3
                className="text-[16px] font-bold mb-5"
                style={{ color: 'var(--color-text-heading)' }}
              >
                Workspace
              </h3>
              <div className="mb-4">
                <FieldLabel>Workspace Name</FieldLabel>
                <SettingsInput
                  value={workspaceName}
                  onChange={setWorkspaceName}
                />
              </div>
              <div className="mb-6">
                <FieldLabel>Timezone</FieldLabel>
                <select
                  className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none appearance-none border-[var(--color-border)] focus:border-[var(--color-accent)]"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-body)',
                  }}
                  defaultValue="UTC+5 (PKT)"
                >
                  <option>UTC+0</option>
                  <option>UTC+5 (PKT)</option>
                  <option>UTC-5 (EST)</option>
                  <option>UTC+1 (CET)</option>
                </select>
              </div>
              <Button
                variant="primary"
                size="md"
                onClick={() => console.log('Save workspace')}
              >
                Save Changes
              </Button>
            </div>
          )}

          {activeSection === 'notifications' && (
            <div>
              <h3
                className="text-[16px] font-bold mb-5"
                style={{ color: 'var(--color-text-heading)' }}
              >
                Notifications
              </h3>
              {[
                'New lead assigned to me',
                'Follow-up reminder due',
                'Client ticket raised',
                'Blog post needs review',
                'Task assigned to me',
                'Project status changed',
                'Comment needs moderation',
                'Milestone completed',
              ].map((label) => (
                <label
                  key={label}
                  className="flex items-center justify-between py-3 border-b cursor-pointer"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <span
                    className="text-[14px]"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    {label}
                  </span>
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 accent-[var(--color-accent)]"
                  />
                </label>
              ))}
            </div>
          )}

          {activeSection === 'security' && (
            <div>
              <h3
                className="text-[16px] font-bold mb-5"
                style={{ color: 'var(--color-text-heading)' }}
              >
                Security
              </h3>
              <div className="flex flex-col gap-3">
                <Button
                  variant="ghost"
                  size="md"
                  onClick={() => console.log('Change password')}
                >
                  Change Password
                </Button>
                <Button
                  variant="danger"
                  size="md"
                  onClick={() => console.log('Sign out all')}
                >
                  Sign out of all sessions
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
