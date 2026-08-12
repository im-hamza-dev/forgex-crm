'use client'

import { useState } from 'react'
import { MessageSquare } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import type { Lead } from '@/types/leads'

type NoteType = 'note' | 'meeting' | 'call' | 'email' | 'whatsapp'

const NOTE_TYPE_LABELS: Record<NoteType, string> = {
  note:      'Note',
  meeting:   'Meeting',
  call:      'Call',
  email:     'Email',
  whatsapp:  'WhatsApp',
}

const MOCK_NOTES = [
  {
    id: '1',
    author: 'Sara Ahmed',
    timeAgo: '2 days ago',
    content: 'Called to discuss proposal timeline. Client is interested but wants to review pricing.',
    type: 'call' as NoteType,
  },
  {
    id: '2',
    author: 'Hamza Iqbal',
    timeAgo: '4 days ago',
    content: 'Sent initial proposal deck with three service tiers. Awaiting response.',
    type: 'email' as NoteType,
  },
  {
    id: '3',
    author: 'Sara Ahmed',
    timeAgo: '1 week ago',
    content: 'Discovery call went well. They have a clear budget and decision-maker is engaged.',
    type: 'meeting' as NoteType,
  },
]

interface LeadDrawerConversationProps {
  lead: Lead
}

export function LeadDrawerConversation({ lead: _lead }: LeadDrawerConversationProps) {
  const [activeType, setActiveType] = useState<NoteType>('note')
  const [noteText, setNoteText] = useState('')

  const handleAddNote = () => {
    if (!noteText.trim()) return
    // TODO: wire to Supabase in feature prompt
    console.log('Add note:', { type: activeType, content: noteText })
    setNoteText('')
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {MOCK_NOTES.map((note) => (
          <div key={note.id} className="flex gap-3">
            <div className="flex items-center justify-center w-6 h-6 rounded shrink-0 mt-0.5 bg-[var(--color-surface-hover)] text-[var(--color-text-muted)]">
              <MessageSquare size={12} />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Avatar name={note.author} size="xs" />
                <span className="text-[13px] font-semibold text-[var(--color-text-heading)]">
                  {note.author}
                </span>
                <span className="text-[11px] text-[var(--color-text-muted)]">
                  {note.timeAgo}
                </span>
              </div>

              <p className="text-[13px] leading-relaxed text-[var(--color-text-body)]">
                {note.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="shrink-0 px-5 py-4 border-t border-[var(--color-border)]">
        <div className="flex items-center gap-1.5 mb-3 flex-wrap">
          {(Object.keys(NOTE_TYPE_LABELS) as NoteType[]).map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setActiveType(type)}
              className={cn(
                'px-3 h-[28px] rounded-full text-[12px] font-medium transition-colors',
                activeType === type
                  ? 'bg-[var(--color-accent)] text-white'
                  : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] border border-[var(--color-border)]',
              )}
            >
              {NOTE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>

        <div className="rounded-lg border border-[var(--color-border)] mb-2">
          <textarea
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            placeholder="Add a note..."
            rows={3}
            className={cn(
              'w-full px-3 py-2.5 text-[13px] resize-none',
              'bg-transparent outline-none rounded-lg',
              'text-[var(--color-text-body)] placeholder:text-[var(--color-text-muted)]',
            )}
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={handleAddNote}
            disabled={!noteText.trim()}
            className={cn(
              'h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white',
              'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
              'transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  )
}
