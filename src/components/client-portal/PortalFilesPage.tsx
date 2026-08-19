'use client'

import { useState, type ReactNode } from 'react'
import {
  DownloadCloud,
  FileText,
  Image,
  FileSpreadsheet,
  Film,
  Paperclip,
  Folder,
} from 'lucide-react'

import { FileViewer, type ViewerFile } from '@/components/ui'

type FileCategory = 'all' | 'images' | 'documents' | 'other'

export interface PortalFile {
  id: string
  name: string
  size: string
  sharedDate: string
  mimeType: string
  url: string
}

interface PortalFilesPageProps {
  files: PortalFile[]
}

function getFileConfig(mimeType: string): {
  icon: ReactNode
  bg: string
  iconColor: string
} {
  if (mimeType === 'application/pdf') {
    return {
      icon: <FileText size={36} strokeWidth={1.5} />,
      bg: '#FDF0F0',
      iconColor: '#8B1A1A',
    }
  }
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('xlsx') ||
    mimeType.includes('csv')
  ) {
    return {
      icon: <FileSpreadsheet size={36} strokeWidth={1.5} />,
      bg: '#EDF5ED',
      iconColor: '#2D6A2D',
    }
  }
  if (mimeType.startsWith('image/')) {
    return {
      icon: <Image size={36} strokeWidth={1.5} />,
      bg: '#F3EEF8',
      iconColor: '#4A1D6B',
    }
  }
  if (
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType.includes('docx')
  ) {
    return {
      icon: <FileText size={36} strokeWidth={1.5} />,
      bg: '#EEF3FA',
      iconColor: '#1A3D6B',
    }
  }
  if (mimeType.startsWith('video/')) {
    return {
      icon: <Film size={36} strokeWidth={1.5} />,
      bg: '#FEF7E6',
      iconColor: '#8B5E00',
    }
  }
  return {
    icon: <Paperclip size={36} strokeWidth={1.5} />,
    bg: 'var(--color-surface-hover)',
    iconColor: '#B0A090',
  }
}

function getCategory(mimeType: string): Exclude<FileCategory, 'all'> {
  if (mimeType.startsWith('image/')) return 'images'
  if (
    mimeType === 'application/pdf' ||
    mimeType.includes('word') ||
    mimeType.includes('document') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('xlsx')
  )
    return 'documents'
  return 'other'
}

const FILTER_TABS: { id: FileCategory; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'images', label: 'Images' },
  { id: 'documents', label: 'Documents' },
  { id: 'other', label: 'Other' },
]

function downloadBlob(blob: Blob, filename: string) {
  const file = new Blob([blob], { type: 'application/octet-stream' })
  const url = URL.createObjectURL(file)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  window.setTimeout(() => URL.revokeObjectURL(url), 1500)
}

async function downloadFromUrl(url: string, filename: string): Promise<boolean> {
  try {
    const res = await fetch(url)
    if (!res.ok) return false
    downloadBlob(await res.blob(), filename)
    return true
  } catch {
    return false
  }
}

export function PortalFilesPage({ files }: PortalFilesPageProps) {
  const [activeFilter, setActiveFilter] = useState<FileCategory>('all')
  const [viewingFile, setViewingFile] = useState<ViewerFile | null>(null)

  const filtered =
    activeFilter === 'all'
      ? files
      : files.filter((f) => getCategory(f.mimeType) === activeFilter)

  return (
    <>
    <div>
      <div className="flex items-center justify-between gap-3 mb-5">
        <h1
          className="text-[22px] sm:text-[26px] font-bold"
          style={{
            color: 'var(--color-text-heading)',
            letterSpacing: '-0.02em',
          }}
        >
          Shared Files
        </h1>
        <span
          className="text-[13px]"
          style={{ color: 'var(--color-text-muted)' }}
        >
          {files.length} {files.length === 1 ? 'file' : 'files'}
        </span>
      </div>

      <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveFilter(tab.id)}
            className="h-[32px] px-4 rounded-full text-[13px] font-medium transition-colors shrink-0"
            style={{
              background:
                activeFilter === tab.id
                  ? 'var(--color-accent)'
                  : 'var(--color-surface-hover)',
              color:
                activeFilter === tab.id
                  ? '#FFFFFF'
                  : 'var(--color-text-secondary)',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--color-surface-hover)' }}
          >
            <Folder size={22} style={{ color: 'var(--color-text-muted)' }} />
          </div>
          <p
            className="text-[15px] font-semibold mb-2"
            style={{ color: 'var(--color-text-body)' }}
          >
            No files shared yet
          </p>
          <p
            className="text-[13px] max-w-[280px] leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Files the Forgex team shares with you will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {filtered.map((file) => {
            const config = getFileConfig(file.mimeType)
            return (
              <div
                key={file.id}
                className="rounded-xl border overflow-hidden cursor-pointer"
                style={{
                  background: 'var(--color-surface)',
                  borderColor: 'var(--color-border)',
                }}
                onClick={() =>
                  setViewingFile({
                    id: file.id,
                    name: file.name,
                    url: file.url,
                    mimeType: file.mimeType,
                    size: file.size,
                  })
                }
              >
                <div
                  className="flex items-center justify-center"
                  style={{
                    height: '120px',
                    background: config.bg,
                    color: config.iconColor,
                  }}
                >
                  {config.icon}
                </div>

                <div className="px-4 pt-3 pb-4">
                  <p
                    className="text-[13px] font-semibold truncate mb-1"
                    style={{ color: 'var(--color-accent)' }}
                  >
                    {file.name}
                  </p>
                  <p
                    className="text-[11px] mb-3"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {file.size} · Shared {file.sharedDate}
                  </p>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      void downloadFromUrl(file.url, file.name)
                    }}
                    className="flex items-center justify-center gap-2 w-full h-[34px] rounded-lg border text-[13px] font-medium transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{
                      borderColor: 'var(--color-border)',
                      color: 'var(--color-text-secondary)',
                    }}
                  >
                    <DownloadCloud size={14} />
                    Download
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
    <FileViewer
      file={viewingFile}
      onClose={() => setViewingFile(null)}
    />
    </>
  )
}
