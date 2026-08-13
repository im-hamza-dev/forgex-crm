'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar, toast } from '@/components/ui'
import { useAuth } from '@/hooks/useAuth'
import {
  useCreateLeadNote,
  useDeleteLeadNote,
  useLeadNotes,
} from '@/hooks/useLeads'
import { canAddNote, canDeleteNote } from '@/lib/leads-permissions'
import type { Lead, LeadNoteType } from '@/types/leads'

const NOTE_TYPES: { value: LeadNoteType; label: string }[] = [
  { value: 'note', label: 'Note' },
  { value: 'call', label: 'Call' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Meeting' },
]

interface LeadDrawerConversationProps {
  lead: Lead
}

export function LeadDrawerConversation({ lead }: LeadDrawerConversationProps) {
  const { profile } = useAuth()
  const { data: notes = [], isLoading } = useLeadNotes(lead.id)
  const createNote = useCreateLeadNote()
  const deleteNote = useDeleteLeadNote()
  const [noteText, setNoteText] = useState('')
  const [noteType, setNoteType] = useState<LeadNoteType>('note')
  const canAdd = canAddNote(profile, lead)

  const handleAddNote = async () => {
    if (!noteText.trim() || !canAdd) return
    try {
      await createNote.mutateAsync({
        leadId: lead.id,
        content: noteText.trim(),
        note_type: noteType,
      })
      setNoteText('')
      setNoteType('note')
      toast.success('Note added')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to add note')
    }
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-4">
        {isLoading && (
          <div className="flex flex-col gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <div className="w-8 h-8 rounded-full animate-pulse bg-[var(--color-surface-hover)] shrink-0" />
                <div className="flex-1 flex flex-col gap-2 pt-1">
                  <div
                    className="h-[12px] rounded animate-pulse bg-[var(--color-surface-hover)]"
                    style={{ width: '40%' }}
                  />
                  <div
                    className="h-[12px] rounded animate-pulse bg-[var(--color-surface-hover)]"
                    style={{ width: '80%' }}
                  />
                  <div
                    className="h-[12px] rounded animate-pulse bg-[var(--color-surface-hover)]"
                    style={{ width: '60%' }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
        {!isLoading && notes.length === 0 && (
          <p className="text-[13px] text-[var(--color-text-muted)] text-center py-8">
            No notes yet
          </p>
        )}
        {notes.map((note, idx) => {
          const authorName = note.author?.full_name ?? 'Team member'
          const typeLabel =
            NOTE_TYPES.find((t) => t.value === note.note_type)?.label ??
            note.note_type
          return (
            <div
              key={note.id}
              className={cn(
                'flex gap-3 group pb-5',
                idx < notes.length - 1 &&
                  'border-b border-[var(--color-border)]',
              )}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  <Avatar
                    name={authorName}
                    src={note.author?.avatar_url}
                    size="sm"
                  />
                  <span className="text-[13px] font-semibold text-[var(--color-text-heading)]">
                    {authorName}
                  </span>
                  <span
                    className="px-2 py-0.5 rounded text-[10px] font-semibold"
                    style={{
                      background: 'var(--color-accent-subtle)',
                      color: 'var(--color-accent)',
                    }}
                  >
                    {typeLabel}
                  </span>
                  <span className="text-[11px] text-[var(--color-text-muted)] ml-auto">
                    {formatDistanceToNow(new Date(note.created_at), {
                      addSuffix: true,
                    })}
                  </span>
                  {canDeleteNote(profile, note.author_id) && (
                    <button
                      type="button"
                      className="opacity-0 group-hover:opacity-100 text-[var(--color-text-muted)] hover:text-[var(--color-danger)] disabled:opacity-40 transition-all"
                      aria-label="Delete note"
                      disabled={deleteNote.isPending}
                      onClick={() => {
                        void deleteNote
                          .mutateAsync({ leadId: lead.id, noteId: note.id })
                          .then(() => toast.success('Note deleted'))
                          .catch((err: unknown) =>
                            toast.error(
                              err instanceof Error
                                ? err.message
                                : 'Failed to delete',
                            ),
                          )
                      }}
                    >
                      {deleteNote.isPending ? (
                        <span className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin block" />
                      ) : (
                        <Trash2 size={13} />
                      )}
                    </button>
                  )}
                </div>
                <p className="text-[14px] leading-relaxed text-[var(--color-text-body)]">
                  {note.content}
                </p>
              </div>
            </div>
          )
        })}
      </div>

      {canAdd && (
        <div className="shrink-0 px-5 py-4 pb-6 border-t border-[var(--color-border)]">
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            {NOTE_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                disabled={createNote.isPending}
                onClick={() => setNoteType(t.value)}
                className={cn(
                  'h-[28px] px-3 rounded-full text-[12px] font-medium transition-colors',
                  'disabled:opacity-40 disabled:cursor-not-allowed',
                  noteType === t.value
                    ? 'bg-[var(--color-accent)] text-white'
                    : 'bg-[var(--color-surface-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-border)]',
                )}
              >
                {t.label}
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
              onClick={() => void handleAddNote()}
              disabled={!noteText.trim() || createNote.isPending}
              className={cn(
                'h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white',
                'bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)]',
                'transition-colors',
                'disabled:opacity-40 disabled:cursor-not-allowed',
                'flex items-center gap-2',
              )}
            >
              {createNote.isPending && (
                <span className="w-3 h-3 rounded-full border-2 border-white border-t-transparent animate-spin" />
              )}
              {createNote.isPending ? 'Adding...' : 'Add Note'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
