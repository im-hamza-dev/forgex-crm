'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import type { Project } from '@/types/projects'

type FileFilter = 'all' | 'client' | 'internal'

function FileIcon({ mimeType }: { mimeType: string }) {
  const color = mimeType.includes('pdf')
    ? '#E74C3C'
    : mimeType.includes('figma')
      ? '#A259FF'
      : mimeType.includes('image')
        ? '#2ECC71'
        : '#607D8B'

  return (
    <div
      className="w-10 h-12 rounded flex items-center justify-center mb-2 text-white text-[10px] font-bold"
      style={{ background: color }}
    >
      {mimeType.split('/')[1]?.toUpperCase().slice(0, 3) ?? 'FILE'}
    </div>
  )
}

export function ProjectFilesTab({ project }: { project: Project }) {
  const [filter, setFilter] = useState<FileFilter>('all')

  const filtered = project.files.filter((f) => {
    if (filter === 'client') return f.is_client_visible
    if (filter === 'internal') return !f.is_client_visible
    return true
  })

  const filterBtns: { value: FileFilter; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'client', label: 'Client files' },
    { value: 'internal', label: 'Internal' },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {filterBtns.map((btn) => (
            <button
              type="button"
              key={btn.value}
              onClick={() => setFilter(btn.value)}
              className={cn(
                'h-[32px] px-3 rounded-lg text-[13px] font-medium border transition-colors',
              )}
              style={
                filter === btn.value
                  ? {
                      background: 'var(--color-action)',
                      color: '#fff',
                      borderColor: 'var(--color-action)',
                    }
                  : {
                      background: 'var(--color-surface)',
                      color: 'var(--color-text-secondary)',
                      borderColor: 'var(--color-border)',
                    }
              }
            >
              {btn.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white transition-colors"
          style={{ background: 'var(--color-accent)' }}
          onClick={() => console.log('Upload file')}
        >
          Upload File
        </button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {filtered.map((file) => (
          <div
            key={file.id}
            className={cn(
              'rounded-xl border bg-[var(--color-surface)] p-4 cursor-pointer',
              'transition-shadow hover:shadow-md',
            )}
            style={{ borderColor: 'var(--color-border)' }}
          >
            <FileIcon mimeType={file.mime_type} />
            <p
              className="text-[13px] font-medium truncate mb-1"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {file.file_name}
            </p>
            <p
              className="text-[11px] mb-2"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {file.file_size} · {file.uploaded_at}
            </p>
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold"
              style={
                file.is_client_visible
                  ? {
                      background: 'var(--color-info-bg)',
                      color: 'var(--color-info)',
                    }
                  : {
                      background: 'var(--color-surface-hover)',
                      color: 'var(--color-text-muted)',
                    }
              }
            >
              {file.is_client_visible ? 'Client can see' : 'Internal'}
            </span>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div
          className="py-16 text-center"
          style={{ color: 'var(--color-text-muted)' }}
        >
          <p className="text-[14px]">No files in this category</p>
        </div>
      )}
    </div>
  )
}
