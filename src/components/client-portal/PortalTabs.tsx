'use client'

import { cn } from '@/lib/utils'

export type PortalTab = 'overview' | 'updates' | 'files' | 'documents' | 'support'

interface PortalTabsProps {
  active: PortalTab
  onChange: (tab: PortalTab) => void
  openTickets?: number
}

const TABS: { id: PortalTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'updates', label: 'Updates' },
  { id: 'files', label: 'Files' },
  { id: 'documents', label: 'Documents' },
  { id: 'support', label: 'Support' },
]

export function PortalTabs({ active, onChange, openTickets = 0 }: PortalTabsProps) {
  return (
    <div
      className="w-full sticky top-[56px] z-20"
      style={{
        background: 'var(--color-surface)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="max-w-[1100px] mx-auto px-2 sm:px-6">
        <div className="flex items-center gap-0 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => onChange(tab.id)}
              className={cn(
                'relative flex items-center gap-1.5 h-11 sm:h-[48px] px-3 sm:px-5 text-[13px] sm:text-[14px] font-medium transition-colors shrink-0 whitespace-nowrap',
                active === tab.id
                  ? 'text-[var(--color-accent)]'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-body)]',
              )}
            >
              {tab.label}

              {tab.id === 'support' && openTickets > 0 && (
                <span
                  className="flex items-center justify-center min-w-[16px] h-[16px] px-0.5 rounded-full text-[9px] font-bold text-white leading-none"
                  style={{ background: 'var(--color-danger)' }}
                >
                  {openTickets}
                </span>
              )}

              {active === tab.id && (
                <span
                  className="absolute bottom-0 left-0 right-0 h-[2px] rounded-t-full"
                  style={{ background: 'var(--color-accent)' }}
                />
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
