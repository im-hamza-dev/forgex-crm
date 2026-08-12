'use client'

import { useState } from 'react'
import { Plus, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardShell } from '@/components/layout'
import { Avatar, Button } from '@/components/ui'

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

const ROLE_BADGE: Record<string, { label: string; bg: string; text: string }> =
  {
    admin: {
      label: 'Admin',
      bg: 'var(--color-accent-subtle)',
      text: 'var(--color-accent)',
    },
    manager: { label: 'Manager', bg: '#EEF3FA', text: '#1A3D6B' },
    member: { label: 'Member', bg: '#F5F5F5', text: '#6B6B6B' },
  }

export default function TeamPage() {
  const [inviteOpen, setInviteOpen] = useState(false)

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
              const roleBadge = ROLE_BADGE[member.role]!
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
            onClick={() => setInviteOpen(false)}
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
                onClick={() => setInviteOpen(false)}
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
                  Email *
                </label>
                <input
                  type="email"
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
                  className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none appearance-none border-[var(--color-border)] focus:border-[var(--color-accent)]"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-body)',
                  }}
                >
                  <option value="member">Member</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
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
                onClick={() => setInviteOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => {
                  console.log('Invite sent')
                  setInviteOpen(false)
                }}
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
