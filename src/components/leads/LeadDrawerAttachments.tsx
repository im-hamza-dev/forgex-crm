'use client'

import { cn } from '@/lib/utils'
import type { Lead } from '@/types/leads'

interface LeadDrawerAttachmentsProps {
  lead: Lead
}

export function LeadDrawerAttachments({ lead: _lead }: LeadDrawerAttachmentsProps) {
  return (
    <div className="p-5 flex flex-col gap-4">
      <button
        type="button"
        className={cn(
          'flex items-center justify-center',
          'h-[80px] rounded-xl border-2 border-dashed',
          'border-[var(--color-accent-border)] bg-[var(--color-accent-subtle)]',
          'cursor-pointer transition-colors w-full',
          'hover:border-[var(--color-accent)]',
        )}
        onClick={() => {
          // TODO: open file picker in feature prompt
        }}
      >
        <p className="text-[13px] text-[var(--color-text-muted)]">
          Drop files here or click to upload
        </p>
      </button>

      <p className="text-center text-[13px] text-[var(--color-text-muted)]">
        No attachments yet
      </p>
    </div>
  )
}
