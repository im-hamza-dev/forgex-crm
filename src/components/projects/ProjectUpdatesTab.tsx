'use client'

import { useState } from 'react'
import { Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Avatar } from '@/components/ui'
import type { Project } from '@/types/projects'

export function ProjectUpdatesTab({ project }: { project: Project }) {
  const [updateText, setUpdateText] = useState('')
  const [visibleToClient, setVisibleToClient] = useState(false)

  return (
    <div className="flex flex-col gap-4">
      <div
        className="rounded-xl border bg-[var(--color-surface)] p-4"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <textarea
          value={updateText}
          onChange={(e) => setUpdateText(e.target.value)}
          placeholder="Post an update..."
          rows={3}
          className={cn(
            'w-full text-[14px] resize-none bg-transparent outline-none',
            'placeholder:text-[var(--color-text-muted)]',
          )}
          style={{ color: 'var(--color-text-body)' }}
        />
        <div
          className="flex items-center justify-between mt-3 pt-3 border-t"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <Eye size={14} style={{ color: 'var(--color-text-muted)' }} />
            <span
              className="text-[12px]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Visible to client
            </span>
            <input
              type="checkbox"
              checked={visibleToClient}
              onChange={(e) => setVisibleToClient(e.target.checked)}
              className="w-4 h-4 accent-[var(--color-accent)]"
            />
          </label>
          <button
            type="button"
            disabled={!updateText.trim()}
            className={cn(
              'h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white transition-colors',
              'disabled:opacity-40 disabled:cursor-not-allowed',
            )}
            style={{ background: 'var(--color-accent)' }}
            onClick={() => {
              console.log('Post update:', { content: updateText, visibleToClient })
              setUpdateText('')
            }}
          >
            Post Update
          </button>
        </div>
      </div>

      {project.updates.map((update) => (
        <div
          key={update.id}
          className="rounded-xl border bg-[var(--color-surface)] p-5"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2.5">
              <Avatar
                name={update.author_name}
                src={update.author_avatar}
                size="sm"
              />
              <span
                className="text-[13px] font-semibold"
                style={{ color: 'var(--color-text-heading)' }}
              >
                {update.author_name}
              </span>
              <span
                className="text-[12px]"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {update.time_ago}
              </span>
            </div>
            {update.is_client_visible && (
              <span
                className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium"
                style={{
                  background: 'var(--color-info-bg)',
                  color: 'var(--color-info)',
                }}
              >
                <Eye size={10} />
                Client can see
              </span>
            )}
          </div>
          <p
            className="text-[14px] leading-relaxed"
            style={{ color: 'var(--color-text-body)' }}
          >
            {update.content}
          </p>
        </div>
      ))}
    </div>
  )
}
