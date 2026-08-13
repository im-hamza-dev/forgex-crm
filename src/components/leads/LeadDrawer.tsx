'use client'

import { useState } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs } from '@/components/ui'
import { getStage } from '@/constants/lead-stages'
import type { Lead } from '@/types/leads'
import { LeadDrawerOverview } from './LeadDrawerOverview'
import { LeadDrawerConversation } from './LeadDrawerConversation'
import { LeadDrawerAttachments } from './LeadDrawerAttachments'

const PRIORITY_COLORS: Record<string, string> = {
  hot: 'var(--color-danger)',
  warm: 'var(--color-warning)',
  cold: 'var(--color-text-secondary)',
}

const PRIORITY_LABELS: Record<string, string> = {
  hot: 'Hot',
  warm: 'Warm',
  cold: 'Cold',
}

interface LeadDrawerProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onEdit?: (lead: Lead) => void
  onConvert?: (lead: Lead) => void
  onDelete?: (lead: Lead) => void
  isDeleting?: boolean
}

const DRAWER_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'conversation', label: 'Conversation' },
  { id: 'attachments', label: 'Attachments' },
]

export function LeadDrawer({
  lead,
  open,
  onClose,
  onConvert,
  onDelete,
  isDeleting = false,
}: LeadDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview')
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!open || !lead) return null

  const stage = getStage(lead.stage)
  const priorityColor = PRIORITY_COLORS[lead.priority] ?? 'var(--color-warning)'
  const priorityLabel = PRIORITY_LABELS[lead.priority] ?? 'Warm'

  return (
    <>
      <div
        className="fixed inset-0 z-[90] bg-[var(--color-overlay-drawer)]"
        onClick={onClose}
      />

      <div
        className={cn(
          'fixed right-0 top-0 bottom-0 z-[100]',
          'flex flex-col w-[520px]',
          'bg-[var(--color-surface)]',
          'border-l border-[var(--color-border)]',
          'shadow-[-8px_0_32px_rgba(26,16,8,0.08)]',
        )}
      >
        <div className="flex items-center gap-3 px-5 py-4 border-b border-[var(--color-border)] shrink-0">
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'flex items-center justify-center w-7 h-7 rounded-lg shrink-0',
              'text-[var(--color-text-muted)] transition-colors',
              'hover:bg-[var(--color-surface-hover)]',
            )}
            aria-label="Close drawer"
          >
            <X size={15} />
          </button>

          <span className="flex-1 text-[16px] font-bold truncate text-[var(--color-text-heading)]">
            {lead.company ?? lead.contact_name}
          </span>

          <span
            className="shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold"
            style={{ background: stage.colorBg, color: stage.colorText }}
          >
            {stage.label}
          </span>

          <span className="flex items-center gap-1 shrink-0">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: priorityColor }}
            />
            <span
              className="text-[12px] font-medium"
              style={{ color: priorityColor }}
            >
              {priorityLabel}
            </span>
          </span>
        </div>

        {onDelete && (
          <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--color-border)] shrink-0">
            {onConvert && (
              <button
                type="button"
                onClick={() => onConvert(lead)}
                className={cn(
                  'h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white',
                  'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
                  'transition-colors',
                )}
              >
                Convert to Project
              </button>
            )}
            <button
              type="button"
              onClick={() => setConfirmDelete(true)}
              className={cn(
                'h-[34px] px-4 rounded-lg text-[13px] font-medium ml-auto',
                'text-[var(--color-danger)] hover:bg-[var(--color-danger-bg)]',
                'transition-colors',
              )}
            >
              Delete
            </button>
          </div>
        )}

        <div className="shrink-0 px-5">
          <Tabs
            items={DRAWER_TABS}
            active={activeTab}
            onChange={setActiveTab}
          />
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {activeTab === 'overview' && <LeadDrawerOverview lead={lead} />}
          {activeTab === 'conversation' && (
            <LeadDrawerConversation lead={lead} />
          )}
          {activeTab === 'attachments' && (
            <LeadDrawerAttachments lead={lead} />
          )}
        </div>
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setConfirmDelete(false)}
          />
          <div
            className="relative z-10 bg-[var(--color-surface)] rounded-2xl shadow-xl p-6 w-[340px] flex flex-col gap-4"
          >
            <h3 className="text-[16px] font-bold text-[var(--color-text-heading)]">
              Delete lead?
            </h3>
            <p className="text-[13px] text-[var(--color-text-secondary)]">
              This will permanently delete{' '}
              <span className="font-semibold text-[var(--color-text-heading)]">
                {lead.company ?? lead.contact_name}
              </span>{' '}
              and all notes, attachments and activity. This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                disabled={isDeleting}
                className="h-[38px] px-4 rounded-lg text-[13px] font-medium border border-[var(--color-border)] text-[var(--color-text-body)] hover:bg-[var(--color-surface-hover)] transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  onDelete?.(lead)
                }}
                className="h-[38px] px-4 rounded-lg text-[13px] font-semibold text-white bg-[var(--color-danger)] hover:opacity-90 transition-opacity disabled:opacity-60 flex items-center gap-2"
              >
                {isDeleting && (
                  <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
                )}
                {isDeleting ? 'Deleting...' : 'Delete lead'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
