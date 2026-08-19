'use client'

import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  Plus,
  X,
  MoreHorizontal,
  Mail,
  ShieldCheck,
  UserX,
  UserCheck,
  Clock,
  ExternalLink,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardShell } from '@/components/layout'
import { Avatar, Button, toast } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  useTeamMembers,
  usePendingInvites,
  useTeamActions,
  useClients,
} from '@/hooks/useTeam'
import {
  INVITE_ROLE_OPTIONS,
  ROLE_LABELS,
  type TeamRole,
} from '@/constants/roles'
import { ROUTES } from '@/constants/routes'
import type {
  TeamMember,
  PendingInvite,
  ClientAccount,
} from '@/server/team/team.server'

const ROLE_BADGE: Record<TeamRole, { bg: string; text: string }> = {
  admin: { bg: 'var(--color-accent-subtle)', text: 'var(--color-accent)' },
  manager: { bg: '#EEF3FA', text: '#1A3D6B' },
  member: { bg: '#F5F5F5', text: '#6B6B6B' },
  client: { bg: '#F5F5F5', text: '#6B6B6B' },
}

export default function TeamPage() {
  const { profile } = useAuth()
  const isAdmin = profile?.role === 'admin'
  const queryClient = useQueryClient()

  const { data: members = [], isLoading } = useTeamMembers()
  const { data: pending = [] } = usePendingInvites()
  const { data: clients = [] } = useClients()
  const {
    updateRole,
    deactivate,
    reactivate,
    cancelInvite,
    revokeClient: revokeClientAction,
    reinstateClient: reinstateClientAction,
  } = useTeamActions()

  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'manager' | 'member'>('member')

  const [editMember, setEditMember] = useState<TeamMember | null>(null)
  const [editRole, setEditRole] = useState<'manager' | 'member'>('member')
  const [confirmDeactivate, setConfirmDeactivate] = useState<TeamMember | null>(
    null,
  )
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [confirmRevokeClient, setConfirmRevokeClient] =
    useState<ClientAccount | null>(null)
  const [openClientMenuId, setOpenClientMenuId] = useState<string | null>(null)

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
      void queryClient.invalidateQueries({ queryKey: ['team'] })
      setInviteOpen(false)
      resetInviteForm()
    } catch {
      toast.error('Something went wrong')
    } finally {
      setInviteLoading(false)
    }
  }

  const handleUpdateRole = async () => {
    if (!editMember) return
    try {
      await updateRole.mutateAsync({ id: editMember.id, role: editRole })
      toast.success(
        `${editMember.full_name ?? 'Member'}'s role updated to ${editRole}`,
      )
      setEditMember(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const handleDeactivate = async () => {
    if (!confirmDeactivate) return
    try {
      await deactivate.mutateAsync(confirmDeactivate.id)
      toast.success(`${confirmDeactivate.full_name ?? 'Member'} deactivated`)
      setConfirmDeactivate(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to deactivate')
    }
  }

  const handleReactivate = async (member: TeamMember) => {
    try {
      await reactivate.mutateAsync(member.id)
      toast.success(`${member.full_name ?? 'Member'} reactivated`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to reactivate')
    }
  }

  const handleCancelInvite = async (invite: PendingInvite) => {
    try {
      await cancelInvite.mutateAsync(invite.id)
      toast.success(`Invite to ${invite.email} cancelled`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to cancel invite')
    }
  }

  const activeMembers = members.filter((m) => m.is_active)
  const inactiveMembers = members.filter((m) => !m.is_active)

  return (
    <DashboardShell title="Team">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2
            className="text-[22px] font-bold"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Team
          </h2>
          <p
            className="text-[13px] mt-0.5"
            style={{ color: 'var(--color-text-muted)' }}
          >
            {activeMembers.length} active member
            {activeMembers.length !== 1 ? 's' : ''}
            {pending.length > 0 &&
              ` · ${pending.length} pending invite${pending.length !== 1 ? 's' : ''}`}
            {clients.length > 0 &&
              ` · ${clients.length} client${clients.length !== 1 ? 's' : ''}`}
          </p>
        </div>
        {isAdmin && (
          <Button
            variant="primary"
            size="md"
            icon={<Plus size={15} />}
            onClick={() => setInviteOpen(true)}
          >
            Invite Member
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <span className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
      ) : (
        <div
          className="rounded-xl border mb-6"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-surface)',
            overflow: 'visible',
          }}
        >
          <table
            className="w-full"
            style={{ borderCollapse: 'separate', borderSpacing: 0 }}
          >
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                {['Member', 'Email', 'Role', 'Status', ''].map((col, i) => (
                  <th
                    key={i}
                    className={cn(
                      'py-3 text-[11px] font-semibold uppercase tracking-[0.06em]',
                      i === 0
                        ? 'text-left pl-5'
                        : i === 4
                          ? 'text-right pr-5 w-[80px]'
                          : 'text-left',
                    )}
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeMembers.map((member, i) => {
                const badge = ROLE_BADGE[member.role]
                const isSelf = member.id === profile?.id
                const canEdit = isAdmin && !isSelf && member.role !== 'admin'

                return (
                  <tr
                    key={member.id}
                    style={{
                      borderBottom:
                        i < activeMembers.length - 1
                          ? '1px solid var(--color-border)'
                          : undefined,
                    }}
                  >
                    <td className="py-4 pl-5 pr-4">
                      <div className="flex items-center gap-3">
                        <Avatar
                          name={member.full_name ?? 'Unknown'}
                          src={member.avatar_url}
                          size="sm"
                        />
                        <div>
                          <p
                            className="text-[14px] font-semibold"
                            style={{ color: 'var(--color-text-heading)' }}
                          >
                            {member.full_name ?? 'Unknown'}
                            {isSelf && (
                              <span
                                className="ml-2 text-[11px] font-normal"
                                style={{ color: 'var(--color-text-muted)' }}
                              >
                                (you)
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className="text-[13px]"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {member.email}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span
                        className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                        style={{ background: badge.bg, color: badge.text }}
                      >
                        {ROLE_LABELS[member.role]}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
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
                    <td className="py-4 pr-5 text-right">
                      {canEdit && (
                        <div className="relative inline-block">
                          <button
                            type="button"
                            onClick={() =>
                              setOpenMenuId(
                                openMenuId === member.id ? null : member.id,
                              )
                            }
                            className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                            style={{ color: 'var(--color-text-muted)' }}
                          >
                            <MoreHorizontal size={15} />
                          </button>
                          {openMenuId === member.id && (
                            <div
                              className="absolute right-0 top-full mt-1 w-[160px] rounded-xl border z-20 py-1 overflow-hidden"
                              style={{
                                background: 'var(--color-surface)',
                                borderColor: 'var(--color-border)',
                              }}
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setEditMember(member)
                                  setEditRole(
                                    member.role as 'manager' | 'member',
                                  )
                                  setOpenMenuId(null)
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] hover:bg-[var(--color-surface-hover)] transition-colors"
                                style={{ color: 'var(--color-text-body)' }}
                              >
                                <ShieldCheck size={13} />
                                Edit role
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setConfirmDeactivate(member)
                                  setOpenMenuId(null)
                                }}
                                className="flex items-center gap-2 w-full px-3 py-2 text-[13px] hover:bg-[var(--color-danger-bg)] transition-colors"
                                style={{ color: 'var(--color-danger)' }}
                              >
                                <UserX size={13} />
                                Deactivate
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {isAdmin && pending.length > 0 && (
        <div className="mb-6">
          <h3
            className="text-[13px] font-semibold mb-3 uppercase tracking-[0.06em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Pending Invites — {pending.length}
          </h3>
          <div
            className="rounded-xl border overflow-hidden"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
            }}
          >
            {pending.map((invite, i) => (
              <div
                key={invite.id}
                className="flex items-center gap-4 px-5 py-3.5"
                style={{
                  borderBottom:
                    i < pending.length - 1
                      ? '1px solid var(--color-border)'
                      : undefined,
                }}
              >
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                  style={{ background: 'var(--color-surface-hover)' }}
                >
                  <Mail size={14} style={{ color: 'var(--color-text-muted)' }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    {invite.full_name ?? invite.email}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {invite.email}
                  </p>
                </div>
                {invite.role && (
                  <span
                    className="px-2.5 py-1 rounded-full text-[11px] font-semibold shrink-0"
                    style={{
                      background:
                        invite.role === 'manager' ? '#EEF3FA' : '#F5F5F5',
                      color: invite.role === 'manager' ? '#1A3D6B' : '#6B6B6B',
                    }}
                  >
                    {invite.role === 'manager' ? 'Manager' : 'Lead Generator'}
                  </span>
                )}
                <div className="flex items-center gap-1.5 shrink-0">
                  <Clock size={11} style={{ color: '#8B5E00' }} />
                  <span
                    className="text-[11px] font-medium"
                    style={{ color: '#8B5E00' }}
                  >
                    Awaiting acceptance
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => void handleCancelInvite(invite)}
                  disabled={cancelInvite.isPending}
                  className="flex items-center gap-1.5 text-[12px] font-medium hover:opacity-70 transition-opacity disabled:opacity-40 shrink-0"
                  style={{ color: 'var(--color-danger)' }}
                >
                  <X size={12} />
                  Revoke
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && inactiveMembers.length > 0 && (
        <div>
          <h3
            className="text-[13px] font-semibold mb-3 uppercase tracking-[0.06em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Deactivated
          </h3>
          <div
            className="rounded-xl border overflow-hidden"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
            }}
          >
            {inactiveMembers.map((member, i) => (
              <div
                key={member.id}
                className="flex items-center gap-4 px-5 py-3.5 opacity-60"
                style={{
                  borderBottom:
                    i < inactiveMembers.length - 1
                      ? '1px solid var(--color-border)'
                      : undefined,
                }}
              >
                <Avatar
                  name={member.full_name ?? 'Unknown'}
                  src={member.avatar_url}
                  size="sm"
                />
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[13px] font-medium"
                    style={{ color: 'var(--color-text-body)' }}
                  >
                    {member.full_name}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {member.email}
                  </p>
                </div>
                <span
                  className="px-2.5 py-1 rounded-full text-[11px] font-semibold"
                  style={{
                    background: ROLE_BADGE[member.role].bg,
                    color: ROLE_BADGE[member.role].text,
                  }}
                >
                  {ROLE_LABELS[member.role]}
                </span>
                {isAdmin && (
                  <button
                    type="button"
                    onClick={() => void handleReactivate(member)}
                    className="flex items-center gap-1.5 text-[12px] font-medium hover:opacity-70 transition-opacity"
                    style={{ color: 'var(--color-success)' }}
                  >
                    <UserCheck size={13} />
                    Reactivate
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isAdmin && clients.length > 0 && (
        <div className="mt-6">
          <h3
            className="text-[13px] font-semibold mb-3 uppercase tracking-[0.06em]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Clients — {clients.length}
          </h3>
          <div
            className="rounded-xl border"
            style={{
              borderColor: 'var(--color-border)',
              background: 'var(--color-surface)',
              overflow: 'visible',
            }}
          >
            <table
              className="w-full"
              style={{ borderCollapse: 'separate', borderSpacing: 0 }}
            >
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  {['Client', 'Email', 'Project', 'Status', ''].map((col, i) => (
                    <th
                      key={col || 'actions'}
                      className={cn(
                        'py-3 text-[11px] font-semibold uppercase tracking-[0.06em]',
                        i === 0
                          ? 'text-left pl-5'
                          : i === 4
                            ? 'text-right pr-5 w-[60px]'
                            : 'text-left',
                      )}
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => (
                  <tr
                    key={client.id}
                    style={{
                      borderBottom:
                        i < clients.length - 1
                          ? '1px solid var(--color-border)'
                          : undefined,
                    }}
                  >
                    <td className="py-3.5 pl-5 pr-4">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-[12px] font-bold text-white shrink-0"
                          style={{ background: 'var(--color-accent)' }}
                        >
                          {(client.full_name ?? client.email)
                            .charAt(0)
                            .toUpperCase()}
                        </div>
                        <div>
                          <p
                            className="text-[14px] font-semibold"
                            style={{ color: 'var(--color-text-heading)' }}
                          >
                            {client.full_name ?? '—'}
                          </p>
                          {client.company && (
                            <p
                              className="text-[11px]"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              {client.company}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className="text-[13px]"
                        style={{ color: 'var(--color-text-secondary)' }}
                      >
                        {client.email}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      <span
                        className="text-[13px] font-medium"
                        style={{ color: 'var(--color-text-body)' }}
                      >
                        {client.project_name ?? '—'}
                      </span>
                    </td>
                    <td className="py-3.5 pr-4">
                      {client.status === 'active' && (
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
                      )}
                      {client.status === 'pending' && (
                        <span
                          className="text-[12px] font-medium px-2.5 py-1 rounded-full"
                          style={{ background: '#FEF7E6', color: '#8B5E00' }}
                        >
                          Awaiting acceptance
                        </span>
                      )}
                      {client.status === 'revoked' && (
                        <span
                          className="text-[12px] font-medium px-2.5 py-1 rounded-full"
                          style={{ background: '#FDF0F0', color: '#8B1A1A' }}
                        >
                          Revoked
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 pr-5 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <a
                          href={`/projects/${client.project_id}`}
                          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
                          style={{ color: 'var(--color-text-muted)' }}
                          title="View project"
                        >
                          <ExternalLink size={14} />
                        </a>

                        {isAdmin && (
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() =>
                                setOpenClientMenuId(
                                  openClientMenuId === client.id
                                    ? null
                                    : client.id,
                                )
                              }
                              className="flex items-center justify-center w-7 h-7 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                              style={{ color: 'var(--color-text-muted)' }}
                            >
                              <MoreHorizontal size={15} />
                            </button>

                            {openClientMenuId === client.id && (
                              <div
                                className="absolute right-0 top-full mt-1 w-[160px] rounded-xl border shadow-lg z-20 py-1 overflow-hidden"
                                style={{
                                  background: 'var(--color-surface)',
                                  borderColor: 'var(--color-border)',
                                }}
                              >
                                {client.status !== 'revoked' ? (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setConfirmRevokeClient(client)
                                      setOpenClientMenuId(null)
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] hover:bg-[var(--color-danger-bg)] transition-colors"
                                    style={{ color: 'var(--color-danger)' }}
                                  >
                                    <UserX size={13} />
                                    Revoke access
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      void reinstateClientAction
                                        .mutateAsync(client.id)
                                        .then(() => {
                                          toast.success(
                                            `${client.full_name ?? 'Client'} reinstated`,
                                          )
                                        })
                                        .catch((err) => {
                                          toast.error(
                                            err instanceof Error
                                              ? err.message
                                              : 'Failed to reinstate',
                                          )
                                        })
                                      setOpenClientMenuId(null)
                                    }}
                                    className="flex items-center gap-2 w-full px-3 py-2 text-[13px] hover:bg-[var(--color-surface-hover)] transition-colors"
                                    style={{ color: 'var(--color-success)' }}
                                  >
                                    <UserCheck size={13} />
                                    Reinstate
                                  </button>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {inviteOpen && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[rgba(26,16,8,0.5)]"
            onClick={() => {
              setInviteOpen(false)
              resetInviteForm()
            }}
          />
          <div className="relative z-10 w-full max-w-[420px] bg-[var(--color-surface)] rounded-2xl">
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
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
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
                  className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none border-[var(--color-border)] focus:border-[var(--color-accent)]"
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
                  className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none border-[var(--color-border)] focus:border-[var(--color-accent)]"
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

      {editMember && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[rgba(26,16,8,0.5)]"
            onClick={() => setEditMember(null)}
          />
          <div className="relative z-10 w-full max-w-[380px] bg-[var(--color-surface)] rounded-2xl">
            <div
              className="flex items-center justify-between px-6 py-5 border-b"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <h2
                className="text-[18px] font-bold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                Edit Role
              </h2>
              <button
                type="button"
                onClick={() => setEditMember(null)}
                className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-[var(--color-surface-hover)] transition-colors"
                style={{ color: 'var(--color-text-muted)' }}
              >
                <X size={16} />
              </button>
            </div>
            <div className="px-6 py-5 flex flex-col gap-4">
              <div
                className="flex items-center gap-3 p-3 rounded-xl"
                style={{ background: 'var(--color-surface-hover)' }}
              >
                <Avatar
                  name={editMember.full_name ?? 'Unknown'}
                  src={editMember.avatar_url}
                  size="sm"
                />
                <div>
                  <p
                    className="text-[13px] font-semibold"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {editMember.full_name}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {editMember.email}
                  </p>
                </div>
              </div>
              <div>
                <label
                  className="block text-[11px] font-semibold uppercase tracking-[0.06em] mb-1.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  New Role
                </label>
                <select
                  value={editRole}
                  onChange={(e) =>
                    setEditRole(e.target.value as 'manager' | 'member')
                  }
                  className="w-full h-[40px] px-3 rounded-lg text-[13px] border outline-none appearance-none border-[var(--color-border)] focus:border-[var(--color-accent)]"
                  style={{
                    background: 'var(--color-surface)',
                    color: 'var(--color-text-body)',
                  }}
                >
                  <option value="manager">Manager</option>
                  <option value="member">Member</option>
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
                onClick={() => setEditMember(null)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="md"
                loading={updateRole.isPending}
                onClick={() => void handleUpdateRole()}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {confirmDeactivate && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[rgba(26,16,8,0.5)]"
            onClick={() => setConfirmDeactivate(null)}
          />
          <div className="relative z-10 w-full max-w-[380px] bg-[var(--color-surface)] rounded-2xl p-6 flex flex-col gap-4">
            <h3
              className="text-[16px] font-bold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Deactivate member?
            </h3>
            <p
              className="text-[13px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span
                className="font-semibold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                {confirmDeactivate.full_name}
              </span>{' '}
              will lose access immediately. You can reactivate them later.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setConfirmDeactivate(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => void handleDeactivate()}
                disabled={deactivate.isPending}
                className="h-[38px] px-4 rounded-lg text-[13px] font-semibold text-white bg-[var(--color-danger)] hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              >
                {deactivate.isPending && (
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                Deactivate
              </button>
            </div>
          </div>
        </div>
      )}
      {confirmRevokeClient && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-[rgba(26,16,8,0.5)]"
            onClick={() => setConfirmRevokeClient(null)}
          />
          <div
            className="relative z-10 w-full max-w-[380px] rounded-2xl shadow-xl p-6 flex flex-col gap-4"
            style={{ background: 'var(--color-surface)' }}
          >
            <h3
              className="text-[16px] font-bold"
              style={{ color: 'var(--color-text-heading)' }}
            >
              Revoke client access?
            </h3>
            <p
              className="text-[13px]"
              style={{ color: 'var(--color-text-secondary)' }}
            >
              <span
                className="font-semibold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                {confirmRevokeClient.full_name}
              </span>{' '}
              will immediately lose access to the client portal. You can
              reinstate them later.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setConfirmRevokeClient(null)}
              >
                Cancel
              </Button>
              <button
                type="button"
                onClick={() => {
                  void revokeClientAction
                    .mutateAsync(confirmRevokeClient.id)
                    .then(() => {
                      toast.success(
                        `${confirmRevokeClient.full_name ?? 'Client'}'s access revoked`,
                      )
                      setConfirmRevokeClient(null)
                    })
                    .catch((err) => {
                      toast.error(
                        err instanceof Error
                          ? err.message
                          : 'Failed to revoke access',
                      )
                    })
                }}
                disabled={revokeClientAction.isPending}
                className="h-[38px] px-4 rounded-lg text-[13px] font-semibold text-white bg-[var(--color-danger)] hover:opacity-90 disabled:opacity-60 flex items-center gap-2"
              >
                {revokeClientAction.isPending && (
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                Revoke Access
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardShell>
  )
}
