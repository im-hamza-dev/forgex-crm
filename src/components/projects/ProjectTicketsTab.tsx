'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { cn } from '@/lib/utils'
import { Button, Select, toast } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  useProjectTickets,
  useReplyToTicket,
  useTicketMessages,
  useUpdateTicketStatus,
} from '@/hooks/useProjects'
import { canManageTickets } from '@/lib/project-permissions'
import type { ClientTicket, Project } from '@/types/projects'

const STATUS_OPTIONS = [
  { value: 'open', label: 'Open' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' },
] as const

const STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  open: { bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
  in_progress: {
    bg: 'var(--color-accent-subtle)',
    color: 'var(--color-accent)',
  },
  resolved: { bg: 'var(--color-success-bg)', color: 'var(--color-success)' },
  closed: {
    bg: 'var(--color-surface-hover)',
    color: 'var(--color-text-muted)',
  },
}

const PRIORITY_STYLE: Record<string, { bg: string; color: string }> = {
  low: { bg: 'var(--color-surface-hover)', color: 'var(--color-text-muted)' },
  medium: { bg: 'var(--color-info-bg)', color: 'var(--color-info)' },
  high: { bg: 'var(--color-warning-bg)', color: 'var(--color-warning)' },
  urgent: { bg: 'var(--color-danger-bg)', color: 'var(--color-danger)' },
}

function TicketThread({
  projectId,
  ticket,
}: {
  projectId: string
  ticket: ClientTicket
}) {
  const { data: messages = [], isLoading } = useTicketMessages(
    projectId,
    ticket.id,
  )
  const reply = useReplyToTicket()
  const updateStatus = useUpdateTicketStatus()
  const [content, setContent] = useState('')

  const handleReply = async () => {
    if (!content.trim()) return
    try {
      await reply.mutateAsync({
        projectId,
        ticketId: ticket.id,
        content: content.trim(),
      })
      toast.success('Reply sent')
      setContent('')
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to send reply')
    }
  }

  const handleStatus = async (status: string) => {
    try {
      await updateStatus.mutateAsync({
        projectId,
        ticketId: ticket.id,
        status: status as 'open' | 'in_progress' | 'resolved' | 'closed',
      })
      toast.success('Status updated')
    } catch (err: unknown) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to update status',
      )
    }
  }

  return (
    <div className="mt-3 pt-3 border-t border-[var(--color-border)]">
      <div className="flex items-center justify-between gap-3 mb-3">
        <p
          className="text-[12px] font-semibold uppercase tracking-[0.06em]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Conversation
        </p>
        <div className="w-[160px]">
          <Select
            options={STATUS_OPTIONS.map((o) => ({
              value: o.value,
              label: o.label,
            }))}
            value={ticket.status}
            onChange={(e) => void handleStatus(e.target.value)}
            disabled={updateStatus.isPending}
          />
        </div>
      </div>

      {isLoading && (
        <div className="flex flex-col gap-2 mb-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="h-12 rounded-lg animate-pulse bg-[var(--color-surface-hover)]"
            />
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 mb-3 max-h-[280px] overflow-y-auto">
        {messages.map((msg) => {
          const isTeam = msg.sender_type === 'team'
          const senderName = isTeam
            ? (msg.team_sender?.full_name ?? 'Team')
            : (msg.client_sender?.full_name ?? 'Client')

          return (
            <div
              key={msg.id}
              className={cn(
                'rounded-lg px-3 py-2 max-w-[85%]',
                isTeam ? 'ml-auto' : 'mr-auto',
              )}
              style={{
                background: isTeam
                  ? 'var(--color-accent-subtle)'
                  : 'var(--color-surface-hover)',
              }}
            >
              <div className="flex items-center gap-2 mb-0.5">
                <span
                  className="text-[11px] font-semibold"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  {senderName}
                </span>
                <span
                  className="text-[10px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {formatDistanceToNow(new Date(msg.created_at), {
                    addSuffix: true,
                  })}
                </span>
              </div>
              <p
                className="text-[13px] whitespace-pre-wrap"
                style={{ color: 'var(--color-text-body)' }}
              >
                {msg.content}
              </p>
            </div>
          )
        })}
      </div>

      <div
        className={cn(
          'flex flex-col gap-2',
          reply.isPending && 'opacity-60 pointer-events-none',
        )}
      >
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={2}
          placeholder="Write a reply…"
          className={cn(
            'w-full text-[13px] resize-none rounded-lg px-3 py-2 outline-none border',
            'border-[var(--color-border)] focus:border-[var(--color-accent)]',
            'placeholder:text-[var(--color-text-muted)]',
          )}
          style={{
            background: 'var(--color-surface)',
            color: 'var(--color-text-body)',
          }}
        />
        <div className="flex justify-end">
          <Button
            variant="primary"
            size="sm"
            disabled={!content.trim()}
            loading={reply.isPending}
            onClick={() => void handleReply()}
          >
            Send Reply
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ProjectTicketsTab({ project }: { project: Project }) {
  const { profile } = useAuth()
  const { data: tickets = [], isLoading } = useProjectTickets(project.id)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  if (!canManageTickets(profile)) {
    return (
      <div
        className="rounded-xl border bg-[var(--color-surface)] py-16 text-center"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <p className="text-[14px]" style={{ color: 'var(--color-text-muted)' }}>
          You do not have access to tickets
        </p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-[72px] rounded-xl animate-pulse bg-[var(--color-surface-hover)] border border-[var(--color-border)]"
          />
        ))}
      </div>
    )
  }

  if (tickets.length === 0) {
    return (
      <div
        className="rounded-xl border bg-[var(--color-surface)] py-16 text-center"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <p className="text-[14px]" style={{ color: 'var(--color-text-muted)' }}>
          No tickets raised by client yet
        </p>
      </div>
    )
  }

  return (
    <div
      className="rounded-xl border bg-[var(--color-surface)]"
      style={{ borderColor: 'var(--color-border)' }}
    >
      {tickets.map((ticket, i) => {
        const statusStyle = STATUS_STYLE[ticket.status] ?? STATUS_STYLE.open!
        const priorityStyle =
          PRIORITY_STYLE[ticket.priority] ?? PRIORITY_STYLE.medium!
        const clientName =
          ticket.client_account?.company ??
          ticket.client_account?.full_name ??
          'Client'
        const expanded = expandedId === ticket.id

        return (
          <div
            key={ticket.id}
            className="px-5 py-4"
            style={{
              borderBottom:
                i < tickets.length - 1
                  ? '1px solid var(--color-border)'
                  : undefined,
            }}
          >
            <button
              type="button"
              className="w-full text-left flex items-start justify-between gap-3"
              onClick={() =>
                setExpandedId((prev) =>
                  prev === ticket.id ? null : ticket.id,
                )
              }
            >
              <div className="min-w-0">
                <p
                  className="text-[14px] font-semibold truncate"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  {ticket.subject}
                </p>
                <p
                  className="text-[12px] mt-0.5"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  {clientName} ·{' '}
                  {formatDistanceToNow(new Date(ticket.created_at), {
                    addSuffix: true,
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                  style={{
                    background: priorityStyle.bg,
                    color: priorityStyle.color,
                  }}
                >
                  {ticket.priority}
                </span>
                <span
                  className="px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize"
                  style={{
                    background: statusStyle.bg,
                    color: statusStyle.color,
                  }}
                >
                  {ticket.status.replace('_', ' ')}
                </span>
              </div>
            </button>

            {expanded && (
              <TicketThread projectId={project.id} ticket={ticket} />
            )}
          </div>
        )
      })}
    </div>
  )
}
