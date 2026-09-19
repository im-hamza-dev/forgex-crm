'use client'

import { useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { cn } from '@/lib/utils'
import { Avatar, Dropdown, type DropdownItem } from '@/components/ui'
import { getStage } from '@/constants/lead-stages'
import { getSourceLabel } from '@/constants/lead-sources'
import type { Lead } from '@/types/leads'

export type LeadAssigneeOption = {
  id: string
  name: string
  avatar?: string | null
}

interface LeadCardProps {
  lead: Lead
  onClick?: () => void
  teamMembers?: LeadAssigneeOption[]
  canAssign?: boolean
  canMove?: boolean
  isDragging?: boolean
  onAssign?: (lead: Lead, assignee: LeadAssigneeOption | null) => void
  onDragStartLead?: (lead: Lead) => void
  onDragEndLead?: () => void
}

const PRIORITY_STYLES: Record<
  string,
  { bg: string; text: string; label: string }
> = {
  hot: {
    bg: 'var(--color-danger-bg)',
    text: 'var(--color-danger)',
    label: 'Hot',
  },
  warm: {
    bg: 'var(--color-warning-bg)',
    text: 'var(--color-warning)',
    label: 'Warm',
  },
  cold: {
    bg: 'var(--color-accent-subtle)',
    text: 'var(--color-text-secondary)',
    label: 'Cold',
  },
}

function isOverdue(dateStr: string | null): boolean {
  if (!dateStr) return false
  const day = dateStr.split('T')[0] ?? dateStr
  const today = new Date()
  const todayStr = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-')
  return day < todayStr
}

function TruncatedText({
  text,
  className,
  lines = 1,
}: {
  text: string
  className?: string
  lines?: 1 | 2
}) {
  const ref = useRef<HTMLSpanElement>(null)
  const [tip, setTip] = useState<{ top: number; left: number } | null>(null)

  return (
    <>
      <span
        ref={ref}
        className={cn(
          'min-w-0',
          lines === 1 ? 'block truncate' : 'line-clamp-2',
          className,
        )}
        onMouseEnter={() => {
          const el = ref.current
          if (!el) return
          const overflowed =
            lines === 1
              ? el.scrollWidth > el.clientWidth + 1
              : el.scrollHeight > el.clientHeight + 1
          if (!overflowed) return
          const rect = el.getBoundingClientRect()
          setTip({ top: rect.bottom + 6, left: rect.left })
        }}
        onMouseLeave={() => setTip(null)}
      >
        {text}
      </span>
      {tip &&
        createPortal(
          <div
            role="tooltip"
            className={cn(
              'fixed z-[300] max-w-[260px] rounded-md px-2 py-1',
              'text-[12px] font-medium leading-snug pointer-events-none',
              'bg-[var(--color-text-heading)] text-[var(--color-surface)]',
              'shadow-[0_8px_24px_rgba(0,0,0,0.18)]',
            )}
            style={{ top: tip.top, left: tip.left }}
          >
            {text}
          </div>,
          document.body,
        )}
    </>
  )
}

export function LeadCard({
  lead,
  onClick,
  teamMembers = [],
  canAssign = false,
  canMove = false,
  isDragging = false,
  onAssign,
  onDragStartLead,
  onDragEndLead,
}: LeadCardProps) {
  const stage = getStage(lead.stage)
  const priority = PRIORITY_STYLES[lead.priority] ?? PRIORITY_STYLES.warm!
  const overdue = isOverdue(lead.next_follow_up)
  const assigneeName =
    lead.assignee_name ?? lead.assigned_profile?.full_name ?? null
  const assigneeAvatar =
    lead.assignee_avatar ?? lead.assigned_profile?.avatar_url ?? null
  const assignBtnRef = useRef<HTMLButtonElement>(null)
  const [assignOpen, setAssignOpen] = useState(false)
  const dragMoved = useRef(false)

  const assignItems: DropdownItem[] = [
    {
      label: 'Unassigned',
      onClick: () => onAssign?.(lead, null),
      disabled: !lead.assigned_to,
    },
    ...teamMembers.map((member) => ({
      label: member.name,
      icon: <Avatar name={member.name} src={member.avatar} size="xs" />,
      onClick: () => onAssign?.(lead, member),
      disabled: lead.assigned_to === member.id,
      dividerAbove: member.id === teamMembers[0]?.id,
    })),
  ]

  return (
    <div
      role="button"
      tabIndex={0}
      draggable={canMove && !assignOpen}
      onDragStart={(e) => {
        if (!canMove) {
          e.preventDefault()
          return
        }
        dragMoved.current = true
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData(
          'text/plain',
          JSON.stringify({ leadId: lead.id, oldStage: lead.stage }),
        )
        onDragStartLead?.(lead)
      }}
      onDragEnd={() => {
        onDragEndLead?.()
        window.setTimeout(() => {
          dragMoved.current = false
        }, 0)
      }}
      onClick={() => {
        if (dragMoved.current) return
        onClick?.()
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && !assignOpen) onClick?.()
      }}
      className={cn(
        'relative w-full min-w-0 text-left',
        'bg-[var(--color-surface)]',
        'border border-[var(--color-border)]',
        'rounded-[10px]',
        'px-3.5 py-3',
        'select-none',
        'transition-[box-shadow,opacity] duration-150',
        'hover:shadow-[0_2px_8px_rgba(26,16,8,0.08)]',
        'focus-visible:outline-none focus-visible:ring-2',
        'focus-visible:ring-[var(--color-accent)]',
        canMove ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
        isDragging && 'opacity-40',
      )}
      style={{ borderLeft: `3px solid ${stage.color}` }}
    >
      <div className="flex items-start justify-between gap-2 mb-1 min-w-0">
        <TruncatedText
          text={lead.contact_name}
          className="flex-1 text-[14px] font-semibold leading-snug text-[var(--color-text-heading)]"
        />
        <span
          className="shrink-0 px-2 py-0.5 rounded-full text-[10px] font-semibold"
          style={{ background: priority.bg, color: priority.text }}
        >
          {priority.label}
        </span>
      </div>

      <TruncatedText
        text={lead.company ?? '—'}
        className="text-[13px] mb-2 text-[var(--color-text-muted)]"
      />

      {lead.description?.trim() && (
        <TruncatedText
          text={lead.description.trim()}
          lines={2}
          className="text-[12px] mb-2 text-[var(--color-text-secondary)] leading-snug"
        />
      )}

      <div className="flex items-center gap-1.5 mb-3 min-w-0">
        <span className="min-w-0 max-w-full px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] truncate">
          {getSourceLabel(lead.source)}
        </span>
        {lead.lead_score != null && (
          <span className="shrink-0 text-[11px] text-[var(--color-text-muted)]">
            Score: {lead.lead_score}/10
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 min-w-0">
        <div className="relative min-w-0 flex-1">
          {canAssign ? (
            <button
              ref={assignBtnRef}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setAssignOpen((v) => !v)
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
              className={cn(
                'flex items-center gap-1.5 min-w-0 max-w-full rounded-md pr-1',
                'hover:bg-[var(--color-surface-hover)] cursor-pointer',
                'outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-accent)]',
              )}
              aria-label={
                assigneeName
                  ? `Assigned to ${assigneeName}. Change assignee`
                  : 'Unassigned. Assign lead'
              }
              title="Change assignee"
            >
              {assigneeName ? (
                <Avatar name={assigneeName} src={assigneeAvatar} size="xs" />
              ) : (
                <div
                  className="w-6 h-6 rounded-full border border-dashed border-[var(--color-border-strong)] shrink-0"
                  aria-hidden
                />
              )}
              <TruncatedText
                text={assigneeName ? assigneeName.split(' ')[0]! : 'Assign'}
                className="flex-1 text-[11px] text-[var(--color-text-secondary)]"
              />
            </button>
          ) : (
            <div className="flex items-center gap-1.5 min-w-0">
              {assigneeName ? (
                <Avatar name={assigneeName} src={assigneeAvatar} size="xs" />
              ) : (
                <div
                  className="w-6 h-6 rounded-full border border-dashed border-[var(--color-border-strong)]"
                  aria-label="Unassigned"
                />
              )}
              {assigneeName && (
                <TruncatedText
                  text={assigneeName.split(' ')[0]!}
                  className="text-[11px] text-[var(--color-text-secondary)]"
                />
              )}
            </div>
          )}
          <Dropdown
            open={assignOpen}
            onClose={() => setAssignOpen(false)}
            items={assignItems}
            align="left"
            anchorRef={assignBtnRef}
            className="max-h-[240px] overflow-y-auto"
          />
        </div>

        {lead.next_follow_up && (
          <span
            className={cn(
              'shrink-0 text-[11px] font-medium tabular-nums',
              overdue
                ? 'text-[var(--color-warning)]'
                : 'text-[var(--color-text-muted)]',
            )}
          >
            {lead.next_follow_up.split('T')[0]}
          </span>
        )}
      </div>
    </div>
  )
}
