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
  hot:  '#8B1A1A',
  warm: '#8B5E00',
  cold: '#1A3D6B',
}

const PRIORITY_LABELS: Record<string, string> = {
  hot:  'Hot',
  warm: 'Warm',
  cold: 'Cold',
}

interface LeadDrawerProps {
  lead: Lead | null
  open: boolean
  onClose: () => void
  onEdit?: (lead: Lead) => void
  onConvert?: (lead: Lead) => void
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
  onEdit,
  onConvert,
}: LeadDrawerProps) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!open || !lead) return null

  const stage = getStage(lead.stage)
  const priorityColor = PRIORITY_COLORS[lead.priority] ?? '#8B5E00'
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
          'flex flex-col w-[360px]',
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

        <div className="flex items-center gap-2 px-5 py-3 border-b border-[var(--color-border)] shrink-0">
          <button
            type="button"
            onClick={() => onEdit?.(lead)}
            className={cn(
              'h-[34px] px-4 rounded-lg text-[13px] font-medium',
              'border border-[var(--color-border)] text-[var(--color-text-body)]',
              'transition-colors hover:bg-[var(--color-surface-hover)]',
            )}
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => onConvert?.(lead)}
            className={cn(
              'h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white',
              'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
              'transition-colors',
            )}
          >
            Convert to Project
          </button>
        </div>

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
    </>
  )
}
