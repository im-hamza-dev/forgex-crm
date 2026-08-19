'use client'

import {
  useState,
  useEffect,
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type ChangeEvent,
} from 'react'
import { useRouter } from 'next/navigation'
import { Camera, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardShell } from '@/components/layout'
import { Avatar, Button, toast } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import { createClient } from '@/lib/supabase/client'
import { fetchClient } from '@/lib/api/fetch-client'
import { ROLE_LABELS, type TeamRole } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'

type SettingsSection = 'profile' | 'security' | 'workspace'

const SETTINGS_NAV: {
  value: SettingsSection
  label: string
  adminOnly?: boolean
}[] = [
  { value: 'profile', label: 'Profile' },
  { value: 'security', label: 'Security' },
  { value: 'workspace', label: 'Workspace', adminOnly: true },
]

const ROLE_BADGE: Record<TeamRole, { bg: string; text: string }> = {
  admin: { bg: 'var(--color-accent-subtle)', text: 'var(--color-accent)' },
  manager: { bg: '#EEF3FA', text: '#1A3D6B' },
  member: { bg: '#F5F5F5', text: '#6B6B6B' },
  client: { bg: '#F5F5F5', text: '#6B6B6B' },
}

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
  type = 'text',
  ...props
}: {
  value: string
  onChange?: (v: string) => void
  disabled?: boolean
  type?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
      className={cn(
        'w-full h-[40px] px-3 rounded-lg text-[13px]',
        'border outline-none transition-colors',
        disabled
          ? 'opacity-60 cursor-not-allowed'
          : 'focus:border-[var(--color-accent)]',
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
  const router = useRouter()
  const { profile, refreshProfile } = useAuth()
  const isAdmin = profile?.role === 'admin'

  const [activeSection, setActiveSection] = useState<SettingsSection>('profile')

  const [fullName, setFullName] = useState(profile?.full_name ?? '')
  const [avatarUrl, setAvatarUrl] = useState<string | null>(
    profile?.avatar_url ?? null,
  )
  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [profileSaving, setProfileSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [passwordSaving, setPasswordSaving] = useState(false)
  const [signOutLoading, setSignOutLoading] = useState(false)

  const [workspaceName, setWorkspaceName] = useState('Forgex Systems')
  const [workspaceSaving, setWorkspaceSaving] = useState(false)

  useEffect(() => {
    if (!profile) return
    setFullName(profile.full_name ?? '')
    setAvatarUrl(profile.avatar_url ?? null)
  }, [profile])

  const handleAvatarSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleProfileSave = async () => {
    if (!fullName.trim()) {
      toast.error('Name cannot be empty')
      return
    }
    setProfileSaving(true)
    try {
      let newAvatarUrl = avatarUrl

      if (avatarFile && profile?.id) {
        const supabase = createClient()
        const ext = avatarFile.name.split('.').pop() ?? 'jpg'
        const path = `${profile.id}/avatar.${ext}`

        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(path, avatarFile, { upsert: true })

        if (uploadError) throw new Error(uploadError.message)

        const {
          data: { publicUrl },
        } = supabase.storage.from('avatars').getPublicUrl(path)

        newAvatarUrl = `${publicUrl}?t=${Date.now()}`
        setAvatarUrl(newAvatarUrl)
        setAvatarFile(null)
        setAvatarPreview(null)
      }

      await fetchClient('/api/settings/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: fullName,
          avatar_url: newAvatarUrl,
        }),
      })

      await refreshProfile()
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save profile')
    } finally {
      setProfileSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Please fill in all password fields')
      return
    }
    if (newPassword !== confirmPassword) {
      toast.error('New passwords do not match')
      return
    }
    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    setPasswordSaving(true)
    try {
      await fetchClient('/api/settings/password', {
        method: 'POST',
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      toast.success('Password changed successfully')
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to change password',
      )
    } finally {
      setPasswordSaving(false)
    }
  }

  const handleSignOutAll = async () => {
    setSignOutLoading(true)
    try {
      const supabase = createClient()
      await supabase.auth.signOut({ scope: 'global' })
      router.push(ROUTES.LOGIN)
    } catch {
      toast.error('Failed to sign out')
    } finally {
      setSignOutLoading(false)
    }
  }

  const displayAvatar = avatarPreview ?? avatarUrl
  const role = (profile?.role ?? 'member') as TeamRole
  const badge = ROLE_BADGE[role]

  const visibleNav = SETTINGS_NAV.filter((item) => !item.adminOnly || isAdmin)

  return (
    <DashboardShell title="Settings">
      <div className="flex gap-5 items-start">
        <div
          className="w-[185px] shrink-0 rounded-xl border bg-[var(--color-surface)] p-2"
          style={{ borderColor: 'var(--color-border)' }}
        >
          {visibleNav.map((item) => (
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
                <div className="relative">
                  {displayAvatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={displayAvatar}
                      alt={fullName}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  ) : (
                    <Avatar name={fullName || 'User'} size="lg" />
                  )}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center border-2 border-white transition-opacity hover:opacity-80"
                    style={{ background: 'var(--color-accent)' }}
                    title="Change avatar"
                  >
                    <Camera size={11} color="white" />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarSelect}
                  />
                </div>
                <div>
                  <p
                    className="text-[16px] font-bold"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {profile?.full_name ?? 'Your Name'}
                  </p>
                  <span
                    className="px-2 py-0.5 rounded-full text-[11px] font-semibold mt-1 inline-block"
                    style={{ background: badge.bg, color: badge.text }}
                  >
                    {ROLE_LABELS[role]}
                  </span>
                </div>
              </div>

              {avatarFile && (
                <div
                  className="mb-4 flex items-center gap-3 p-3 rounded-lg"
                  style={{ background: 'var(--color-surface-hover)' }}
                >
                  <p
                    className="text-[12px] flex-1"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    New avatar selected: {avatarFile.name}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setAvatarFile(null)
                      setAvatarPreview(null)
                    }}
                    className="text-[11px] hover:opacity-70"
                    style={{ color: 'var(--color-danger)' }}
                  >
                    Remove
                  </button>
                </div>
              )}

              <div className="mb-4">
                <FieldLabel>Full Name</FieldLabel>
                <SettingsInput
                  value={fullName}
                  onChange={setFullName}
                  placeholder="Your full name"
                />
              </div>

              <div className="mb-6">
                <FieldLabel>Email</FieldLabel>
                <SettingsInput value={profile?.email ?? ''} disabled />
                <p
                  className="mt-1 text-[12px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Contact admin to change your email
                </p>
              </div>

              <Button
                variant="primary"
                size="md"
                loading={profileSaving}
                onClick={() => void handleProfileSave()}
              >
                Save Changes
              </Button>
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

              <div
                className="rounded-xl border p-5 mb-5"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p
                  className="text-[14px] font-semibold mb-4"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  Change Password
                </p>

                <div className="flex flex-col gap-4">
                  <div>
                    <FieldLabel>Current Password</FieldLabel>
                    <div className="relative">
                      <SettingsInput
                        type={showCurrentPw ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={setCurrentPassword}
                        placeholder="Enter current password"
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
                    <FieldLabel>New Password</FieldLabel>
                    <div className="relative">
                      <SettingsInput
                        type={showNewPw ? 'text' : 'password'}
                        value={newPassword}
                        onChange={setNewPassword}
                        placeholder="Min. 8 characters"
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
                    <FieldLabel>Confirm New Password</FieldLabel>
                    <SettingsInput
                      type="password"
                      value={confirmPassword}
                      onChange={setConfirmPassword}
                      placeholder="Repeat new password"
                    />
                  </div>

                  <Button
                    variant="primary"
                    size="md"
                    loading={passwordSaving}
                    disabled={
                      !currentPassword || !newPassword || !confirmPassword
                    }
                    onClick={() => void handlePasswordChange()}
                  >
                    Change Password
                  </Button>
                </div>
              </div>

              <div
                className="rounded-xl border p-5"
                style={{ borderColor: 'var(--color-border)' }}
              >
                <p
                  className="text-[14px] font-semibold mb-1"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  Sign Out Everywhere
                </p>
                <p
                  className="text-[13px] mb-4"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Sign out of all devices and sessions including this one.
                </p>
                <Button
                  variant="danger"
                  size="md"
                  loading={signOutLoading}
                  onClick={() => void handleSignOutAll()}
                >
                  Sign out of all sessions
                </Button>
              </div>
            </div>
          )}

          {activeSection === 'workspace' && isAdmin && (
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
                  placeholder="Your agency name"
                />
              </div>

              <div className="mb-6">
                <FieldLabel>Timezone</FieldLabel>
                <select
                  className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none appearance-none focus:border-[var(--color-accent)]"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-body)',
                    borderColor: 'var(--color-border)',
                  }}
                  defaultValue="UTC+5 (PKT)"
                >
                  <option>UTC+0 (GMT)</option>
                  <option>UTC+5 (PKT)</option>
                  <option>UTC-5 (EST)</option>
                  <option>UTC-8 (PST)</option>
                  <option>UTC+1 (CET)</option>
                  <option>UTC+4 (GST)</option>
                  <option>UTC+8 (SGT)</option>
                </select>
              </div>

              <Button
                variant="primary"
                size="md"
                loading={workspaceSaving}
                onClick={() => {
                  setWorkspaceSaving(true)
                  setTimeout(() => {
                    setWorkspaceSaving(false)
                    toast.success('Workspace settings saved')
                  }, 600)
                }}
              >
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </DashboardShell>
  )
}
