'use client'

import { useState, type ReactNode } from 'react'
import {
  DownloadCloud,
  FileText,
  ClipboardList,
  Lock,
  Mail,
  Heart,
  Star,
  Paperclip,
} from 'lucide-react'
import { FileViewer, type ViewerFile } from '@/components/ui'

export interface PortalDocument {
  id: string
  type: 'proposal' | 'contract' | 'nda' | 'welcome' | 'thankyou' | 'recommendation' | 'other'
  title: string
  sentDate: string
  viewed: boolean
  content: string
  content_type: 'editor' | 'pdf'
  file_url?: string | null
}

interface PortalDocumentsPageProps {
  documents: PortalDocument[]
  onOpen?: (sendId: string) => void
}

const TYPE_CONFIG: Record<
  PortalDocument['type'],
  { label: string; icon: ReactNode; iconBg: string; iconColor: string }
> = {
  proposal: {
    label: 'Proposal',
    icon: <FileText size={18} strokeWidth={1.75} />,
    iconBg: '#F5EDE6',
    iconColor: '#9c6644',
  },
  contract: {
    label: 'Contract',
    icon: <ClipboardList size={18} strokeWidth={1.75} />,
    iconBg: '#EEF3FA',
    iconColor: '#1A3D6B',
  },
  nda: {
    label: 'NDA',
    icon: <Lock size={18} strokeWidth={1.75} />,
    iconBg: '#F3EEF8',
    iconColor: '#4A1D6B',
  },
  welcome: {
    label: 'Welcome',
    icon: <Mail size={18} strokeWidth={1.75} />,
    iconBg: '#EDF5ED',
    iconColor: '#2D6A2D',
  },
  thankyou: {
    label: 'Thank You',
    icon: <Heart size={18} strokeWidth={1.75} />,
    iconBg: '#FEF7E6',
    iconColor: '#8B5E00',
  },
  recommendation: {
    label: 'Recommendation',
    icon: <Star size={18} strokeWidth={1.75} />,
    iconBg: '#FEF7E6',
    iconColor: '#8B5E00',
  },
  other: {
    label: 'Document',
    icon: <Paperclip size={18} strokeWidth={1.75} />,
    iconBg: '#F5F5F5',
    iconColor: '#B0A090',
  },
}

function safeFilename(title: string, ext: string): string {
  const cleaned = title.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, ' ').trim() || 'document'
  return cleaned.toLowerCase().endsWith(`.${ext}`) ? cleaned : `${cleaned}.${ext}`
}

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

export function PortalDocumentsPage({ documents, onOpen }: PortalDocumentsPageProps) {
  const [viewingFile, setViewingFile] = useState<ViewerFile | null>(null)

  const handleOpen = (doc: PortalDocument) => {
    if (doc.content_type === 'pdf' && doc.file_url) {
      setViewingFile({
        id: doc.id,
        name: doc.title,
        url: doc.file_url,
        mimeType: 'application/pdf',
      })
    } else if (doc.content?.trim()) {
      setViewingFile({
        id: doc.id,
        name: doc.title,
        url: '#',
        mimeType: 'text/markdown',
        docContent: doc.content,
      })
    }
    setTimeout(() => onOpen?.(doc.id), 0)
  }

  const handleDownload = async (doc: PortalDocument) => {
    const filename = safeFilename(
      doc.title,
      doc.content_type === 'pdf' ? 'pdf' : 'md',
    )

    if (doc.content_type === 'pdf' && doc.file_url) {
      const ok = await downloadFromUrl(doc.file_url, filename)
      if (!ok) window.open(doc.file_url, '_blank', 'noopener,noreferrer')
      setTimeout(() => onOpen?.(doc.id), 0)
      return
    }

    if (doc.content?.trim()) {
      downloadBlob(
        new Blob([doc.content], { type: 'text/markdown;charset=utf-8' }),
        filename,
      )
      setTimeout(() => onOpen?.(doc.id), 0)
    }
  }

  if (documents.length === 0) {
    return (
      <div>
        <div className="mb-6">
          <h1
            className="text-[22px] sm:text-[26px] font-bold"
            style={{ color: 'var(--color-text-heading)', letterSpacing: '-0.02em' }}
          >
            Documents
          </h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Contracts, proposals, and documents from Forgex
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
            style={{ background: 'var(--color-surface-hover)' }}
          >
            <span className="text-[22px]">📄</span>
          </div>
          <p className="text-[15px] font-semibold mb-2" style={{ color: 'var(--color-text-body)' }}>
            No documents yet
          </p>
          <p className="text-[13px] max-w-[300px] leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
            Contracts, proposals, and other documents shared by Forgex will appear here.
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div>
        <div className="mb-6">
          <h1
            className="text-[22px] sm:text-[26px] font-bold"
            style={{ color: 'var(--color-text-heading)', letterSpacing: '-0.02em' }}
          >
            Documents
          </h1>
          <p className="text-[14px] mt-1" style={{ color: 'var(--color-text-muted)' }}>
            Contracts, proposals, and documents from Forgex
          </p>
        </div>

        <div
          className="rounded-xl border overflow-hidden"
          style={{ background: 'var(--color-surface)', borderColor: 'var(--color-border)' }}
        >
          {documents.map((doc, i) => {
            const config = TYPE_CONFIG[doc.type]
            return (
              <div
                key={doc.id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 px-4 sm:px-5 py-4 transition-colors hover:bg-[var(--color-surface-hover)] cursor-pointer"
                style={{
                  borderBottom: i < documents.length - 1 ? '1px solid var(--color-border)' : undefined,
                }}
                onClick={() => handleOpen(doc)}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{ background: config.iconBg, color: config.iconColor }}
                >
                  {config.icon}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p
                    className="text-[10px] font-semibold uppercase tracking-[0.07em] mb-0.5"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {config.label}
                  </p>
                  <p
                    className="text-[14px] font-semibold truncate"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    {doc.title}
                  </p>
                  <p className="text-[12px] mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                    Sent {doc.sentDate}
                  </p>
                </div>

                {/* Right actions */}
                <div
                  className="flex items-center gap-2 shrink-0 self-end sm:self-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  {doc.viewed ? (
                    <span className="text-[12px] font-medium" style={{ color: '#2D6A2D' }}>
                      Viewed
                    </span>
                  ) : (
                    <span
                      className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                      style={{ background: '#FEF7E6', color: '#8B5E00' }}
                    >
                      New
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleOpen(doc)
                    }}
                    className="h-[34px] px-4 rounded-lg text-[13px] font-semibold text-white transition-colors hover:opacity-90"
                    style={{ background: 'var(--color-accent)' }}
                  >
                    Open
                  </button>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation()
                      void handleDownload(doc)
                    }}
                    className="w-[34px] h-[34px] flex items-center justify-center rounded-lg border transition-colors hover:bg-[var(--color-surface-hover)]"
                    style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
                    aria-label={`Download ${doc.title}`}
                  >
                    <DownloadCloud size={15} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <FileViewer
        file={viewingFile}
        onClose={() => setViewingFile(null)}
      />
    </>
  )
}
