'use client'

import { useState } from 'react'
import { MessageCircle, Clock, Lock } from 'lucide-react'

type TicketStatus = 'open' | 'in_progress' | 'resolved' | 'closed'
type TicketPriority = 'low' | 'medium' | 'high'
type SupportFilter = 'all' | 'open' | 'in_progress' | 'resolved'

export interface PortalTicket {
  id: string
  subject: string
  status: TicketStatus
  priority: TicketPriority
  raisedDate: string
  lastMessage: string
  lastMessageTime: string
  hasNewReply: boolean
}

interface PortalSupportPageProps {
  tickets: PortalTicket[]
  onRaiseRequest: () => void
  onOpenTicket: (ticket: PortalTicket) => void
}

const STATUS_CONFIG: Record<
  TicketStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  open: { label: 'Open', bg: '#FEF7E6', text: '#8B5E00', border: '#8B5E00' },
  in_progress: { label: 'In Progress', bg: '#EEF3FA', text: '#1A3D6B', border: '#1A3D6B' },
  resolved: { label: 'Resolved', bg: '#EDF5ED', text: '#2D6A2D', border: '#2D6A2D' },
  closed: { label: 'Closed', bg: '#F5F5F5', text: '#6B6B6B', border: '#B0A090' },
}

const PRIORITY_COLORS: Record<TicketPriority, string> = {
  low: '#1A3D6B',
  medium: '#8B5E00',
  high: '#8B1A1A',
}

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export function PortalSupportPage({
  tickets,
  onRaiseRequest,
  onOpenTicket,
}: PortalSupportPageProps) {
  const [activeFilter, setActiveFilter] = useState<SupportFilter>('all')

  const counts = {
    all: tickets.length,
    open: tickets.filter((t) => t.status === 'open').length,
    in_progress: tickets.filter((t) => t.status === 'in_progress').length,
    resolved: tickets.filter((t) => t.status === 'resolved').length,
  }

  const filtered =
    activeFilter === 'all'
      ? tickets
      : tickets.filter((t) => t.status === activeFilter)

  const FILTERS: { id: SupportFilter; label: string }[] = [
    { id: 'all', label: `All (${counts.all})` },
    { id: 'open', label: `Open (${counts.open})` },
    { id: 'in_progress', label: `In Progress (${counts.in_progress})` },
    { id: 'resolved', label: `Resolved (${counts.resolved})` },
  ]

  if (tickets.length === 0) {
    return (
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h1
            className="text-[22px] sm:text-[26px] font-bold"
            style={{ color: 'var(--color-text-heading)', letterSpacing: '-0.02em' }}
          >
            Support Requests
          </h1>
          <button
            type="button"
            onClick={onRaiseRequest}
            className="w-full sm:w-auto h-[38px] px-5 rounded-lg text-[13px] font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: 'var(--color-accent)' }}
          >
            Raise a Request
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6"
            style={{ background: '#F5EDE6', color: 'var(--color-accent)' }}
          >
            <MessageCircle size={32} strokeWidth={1.5} />
          </div>
          <h2
            className="text-[22px] font-bold mb-2"
            style={{ color: 'var(--color-text-heading)' }}
          >
            How can we help?
          </h2>
          <p
            className="text-[14px] max-w-[360px] leading-relaxed mb-7"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Have a question or need something changed? Raise a request and we&apos;ll
            get back to you within 1 business day.
          </p>
          <button
            type="button"
            onClick={onRaiseRequest}
            className="h-[48px] px-7 rounded-xl text-[15px] font-semibold text-white transition-colors hover:opacity-90"
            style={{ background: 'var(--color-accent)' }}
          >
            Raise a Request
          </button>
          <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-5 mt-5">
            <span
              className="flex items-center gap-1.5 text-[13px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Clock size={13} />
              1 business day response
            </span>
            <span
              className="flex items-center gap-1.5 text-[13px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <Lock size={13} />
              Direct line to the team
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <h1
          className="text-[22px] sm:text-[26px] font-bold"
          style={{ color: 'var(--color-text-heading)', letterSpacing: '-0.02em' }}
        >
          Support Requests
        </h1>
        <button
          type="button"
          onClick={onRaiseRequest}
          className="w-full sm:w-auto h-[38px] px-5 rounded-lg text-[13px] font-semibold text-white transition-colors hover:opacity-90"
          style={{ background: 'var(--color-accent)' }}
        >
          Raise a Request
        </button>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setActiveFilter(f.id)}
            className="h-[30px] px-3.5 rounded-full text-[12px] font-medium transition-colors shrink-0 whitespace-nowrap"
            style={{
              background:
                activeFilter === f.id
                  ? 'var(--color-accent)'
                  : 'var(--color-surface-hover)',
              color:
                activeFilter === f.id ? '#FFFFFF' : 'var(--color-text-secondary)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {filtered.map((ticket) => {
          const statusConf = STATUS_CONFIG[ticket.status]
          return (
            <div
              key={ticket.id}
              onClick={() => onOpenTicket(ticket)}
              className="rounded-xl border overflow-hidden cursor-pointer transition-all hover:shadow-md"
              style={{
                background: 'var(--color-surface)',
                borderColor: 'var(--color-border)',
                borderLeft: `3px solid ${statusConf.border}`,
              }}
            >
              <div className="px-5 py-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <p
                    className="text-[14px] font-semibold break-words"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {ticket.subject}
                  </p>
                  <div className="flex items-center gap-2 shrink-0">
                    {ticket.hasNewReply && (
                      <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                        style={{ background: '#FEF7E6', color: '#8B5E00' }}
                      >
                        New reply
                      </span>
                    )}
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: statusConf.bg, color: statusConf.text }}
                    >
                      {statusConf.label}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 mb-3">
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ background: PRIORITY_COLORS[ticket.priority] }}
                  />
                  <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                    {PRIORITY_LABELS[ticket.priority]}
                  </span>
                  <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                    ·
                  </span>
                  <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>
                    Raised {ticket.raisedDate}
                  </span>
                </div>

                <div
                  className="flex items-center justify-between pt-3"
                  style={{ borderTop: '1px solid var(--color-border)' }}
                >
                  <p
                    className="text-[13px] truncate flex-1 mr-4"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {ticket.lastMessage}
                  </p>
                  <span
                    className="text-[12px] shrink-0"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {ticket.lastMessageTime}
                  </span>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
