'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardShell } from '@/components/layout'
import { Avatar, Button, toast } from '@/components/ui'
import { INVITE_ROLE_OPTIONS, ROLE_LABELS, type TeamRole } from '@/constants/roles'
import { ROUTES } from '@/constants/routes'

const TEAM_MEMBERS = [
  {
    id: 'user-hi',
    name: 'Hamza Iqbal',
    email: 'hamza@forgex.systems',
    role: 'admin' as const,
    status: 'active' as const,
    last_active: '2 min ago',
    avatar: null as string | null,
  },
  {
    id: 'user-sa',
    name: 'Sara Ahmed',
    email: 'sara@forgex.systems',
    role: 'manager' as const,
    status: 'active' as const,
    last_active: '1 hour ago',
    avatar: null as string | null,
  },
  {
    id: 'user-zm',
    name: 'Zain Malik',
    email: 'zain@forgex.systems',
    role: 'member' as const,
    status: 'active' as const,
    last_active: '3 hours ago',
    avatar: null as string | null,
  },
]

const ROLE_BADGE: Record<
  TeamRole,
  { label: string; bg: string; text: string }
> = {
  admin: {
    label: ROLE_LABELS.admin,
    bg: 'var(--color-accent-subtle)',
    text: 'var(--color-accent)',
  },
  manager: {
    label: ROLE_LABELS.manager,
    bg: '#EEF3FA',
    text: '#1A3D6B',
  },
  member: {
    label: ROLE_LABELS.member,
    bg: '#F5F5F5',
    text: '#6B6B6B',
  },
}

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'manager' | 'member'>('member')

  const resetInviteForm = () => {
    setInviteEmail('')
    setInviteName('')
    setInviteRole('member')
  }

  const handleInvite = async () => {
    if (!inviteEmail || !inviteName) return
    setInviteLoading(true)
    try {
      const res = await fetch(ROUTES.API.TEAM_INVITE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteEmail,
          full_name: inviteName,
          role: inviteRole,
        }),
      })
      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        toast.error(data.error ?? 'Failed to send invite')
        return
      }
      toast.success(`Invite sent to ${inviteEmail}`)
      setInviteOpen(false)
      resetInviteForm()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setInviteLoading(false)
    }
  }

  return (
    <DashboardShell title="Team" notificationCount={3}>
      <div className="flex items-center justify-between mb-5">
        <h2
          className="text-[22px] font-bold"
          style={{ color: 'var(--color-text-heading)' }}
        >
          Team
        </h2>
        <Button
          variant="primary"
          size="md"
          icon={<Plus size={15} />}
          onClick={() => setInviteOpen(true)}
          className="rounded-lg"
        >
          Invite Member
        </Button>
      </div>

      <div
        className="rounded-xl border bg-[var(--color-surface)]"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <table className="w-full">
          <thead>
            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
              {[
                { label: 'Member', cls: 'text-left pl-5' },
                { label: 'Email', cls: 'text-left w-[220px]' },
                { label: 'Role', cls: 'text-left w-[120px]' },
                { label: 'Status', cls: 'text-left w-[110px]' },
                { label: 'Last Active', cls: 'text-left w-[120px]' },
                { label: '', cls: 'text-right pr-5 w-[100px]' },
              ].map((col, i) => (
                <th
                  key={i}
                  className={cn(
                    'py-3 text-[11px] font-semibold uppercase tracking-[0.06em]',
                    col.cls,
                  )}
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {TEAM_MEMBERS.map((member, i) => {
              const roleBadge = ROLE_BADGE[member.role]
              return (
                <tr
                  key={member.id}
                  style={{
                    borderBottom:
                      i < TEAM_MEMBERS.length - 1
                        ? '1px solid var(--color-border)'
                        : undefined,
                  }}
                >
                  <td className="py-4 pl-5 pr-4">
                    <div className="flex items-center gap-3">
                      <Avatar
                        name={member.name}
                        src={member.avatar}
                        size="sm"
                      />
                      <span
                        className="text-[14px] font-semibold"
                        style={{ color: 'var(--color-text-heading)' }}
                      >
                        {member.name}
                      </span>
                    </div>
                  </td>

                  <td className="py-4 pr-4 w-[220px]">
                    <span
                      className="text-[13px]"
                      style={{ color: 'var(--color-text-secondary)' }}
                    >
                      {member.email}
                    </span>
                  </td>

                  <td className="py-4 pr-4 w-[120px]">
                    <span
                      className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                      style={{
                        background: roleBadge.bg,
                        color: roleBadge.text,
                      }}
                    >
                      {roleBadge.label}
                    </span>
                  </td>

                  <td className="py-4 pr-4 w-[110px]">
                    <span className="flex items-center gap-1.5">
                      <span
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--color-success)' }}
                      />
                      <span
                        className="text-[13px]"
                        style={{ color: 'var(--color-text-body)' }}
                      >
                        Active
                      </span>
                    </span>
                  </td>

                  <td className="py-4 pr-4 w-[120px]">
                    <span
                      className="text-[12px]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {member.last_active}
                    </span>
                  </td>

                  <td className="py-4 pr-5 w-[100px] text-right">
                    <button
                      type="button"
                      className="text-[13px] font-medium transition-opacity hover:opacity-70"
                      style={{ color: 'var(--color-accent)' }}
                      onClick={() => console.log('Edit role:', member.name)}
                    >
                      Edit role
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {inviteOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[rgba(26,16,8,0.5)]"
            onClick={() => {
              setInviteOpen(false)
              resetInviteForm()
            }}
          />
          <div className="relative z-10 w-full max-w-[420px] bg-[var(--color-surface)] rounded-2xl shadow-[0_16px_48px_rgba(26,16,8,0.16)]">
            <div
              className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <h2
                className="text-[18px] font-bold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                Invite Member
              </h2>
              <button
                type="button"
                onClick={() => {
                  setInviteOpen(false)
                  resetInviteForm()
                }}
                className="flex items-center justify-center w-8 h-8 rounded-lg text-[var(--color-text-muted)] hover:bg-[var(--color-surface-hover)] transition-colors"
                aria-label="Close"
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Sara Ahmed"
                  className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none placeholder:text-[var(--color-text-muted)] border-[var(--color-border)] focus:border-[var(--color-accent)]"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-body)',
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Email *
                </label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@forgex.systems"
                  className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none placeholder:text-[var(--color-text-muted)] border-[var(--color-border)] focus:border-[var(--color-accent)]"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-body)',
                  }}
                />
              </div>
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Role
                </label>
                <select
                  value={inviteRole}
                  onChange={(e) =>
                    setInviteRole(e.target.value as 'manager' | 'member')
                  }
                  className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none appearance-none border-[var(--color-border)] focus:border-[var(--color-accent)]"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-body)',
                  }}
                >
                  {INVITE_ROLE_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div
              className="flex items-center justify-between px-6 py-4 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <Button
                variant="ghost"
                size="md"
                onClick={() => {
                  setInviteOpen(false)
                  resetInviteForm()
                }}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={inviteLoading}
                disabled={!inviteEmail || !inviteName}
                onClick={() => void handleInvite()}
              >
                Send Invite
              </Button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
