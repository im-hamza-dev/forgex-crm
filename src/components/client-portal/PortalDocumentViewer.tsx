'use client'

import { useEffect, type ReactNode } from 'react'
import {
  X,
  DownloadCloud,
  FileText,
  ClipboardList,
  Lock,
  Mail,
  Heart,
  Star,
  Paperclip,
} from 'lucide-react'
import type { PortalDocument } from './PortalDocumentsPage'

const TYPE_CONFIG: Record<
  PortalDocument['type'],
  { label: string; icon: ReactNode; iconBg: string; iconColor: string }
> = {
  proposal: {
    label: 'Proposal',
    icon: <FileText size={14} strokeWidth={1.75} />,
    iconBg: '#F5EDE6',
    iconColor: '#9c6644',
  },
  contract: {
    label: 'Contract',
    icon: <ClipboardList size={14} strokeWidth={1.75} />,
    iconBg: '#EEF3FA',
    iconColor: '#1A3D6B',
  },
  nda: {
    label: 'NDA',
    icon: <Lock size={14} strokeWidth={1.75} />,
    iconBg: '#F3EEF8',
    iconColor: '#4A1D6B',
  },
  welcome: {
    label: 'Welcome',
    icon: <Mail size={14} strokeWidth={1.75} />,
    iconBg: '#EDF5ED',
    iconColor: '#2D6A2D',
  },
  thankyou: {
    label: 'Thank You',
    icon: <Heart size={14} strokeWidth={1.75} />,
    iconBg: '#FEF7E6',
    iconColor: '#8B5E00',
  },
  recommendation: {
    label: 'Recommendation',
    icon: <Star size={14} strokeWidth={1.75} />,
    iconBg: '#FEF7E6',
    iconColor: '#8B5E00',
  },
  other: {
    label: 'Document',
    icon: <Paperclip size={14} strokeWidth={1.75} />,
    iconBg: '#F5F5F5',
    iconColor: '#B0A090',
  },
}

interface PortalDocumentViewerProps {
  document: PortalDocument
  onClose: () => void
}

function renderContent(content: string) {
  const lines = content.split('\n')
  const elements: ReactNode[] = []
  let listItems: string[] = []
  let listType: 'ol' | 'ul' | null = null

  const flushList = (key: string) => {
    if (listItems.length === 0) return
    if (listType === 'ol') {
      elements.push(
        <ol key={`list-${key}`} className="list-none pl-0 mb-4 space-y-1">
          {listItems.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[14px] leading-relaxed"
              style={{ color: 'var(--color-accent)' }}
            >
              <span className="font-semibold shrink-0 mt-0.5">{i + 1}.</span>
              <span>{item}</span>
            </li>
          ))}
        </ol>,
      )
    } else {
      elements.push(
        <ul key={`list-${key}`} className="list-none pl-0 mb-4 space-y-1">
          {listItems.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[14px] leading-relaxed"
              style={{ color: 'var(--color-text-body)' }}
            >
              <span
                className="mt-2 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--color-accent)' }}
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>,
      )
    }
    listItems = []
    listType = null
  }

  lines.forEach((line, idx) => {
    const key = `line-${idx}`

    if (line.startsWith('# ')) {
      flushList(key)
      elements.push(
        <h1
          key={key}
          className="text-[22px] font-bold mb-3 mt-0"
          style={{ color: 'var(--color-text-heading)', letterSpacing: '-0.02em' }}
        >
          {line.slice(2)}
        </h1>,
      )
    } else if (line.startsWith('## ')) {
      flushList(key)
      elements.push(
        <h2
          key={key}
          className="text-[17px] font-semibold mb-2 mt-6"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {line.slice(3)}
        </h2>,
      )
    } else if (line.startsWith('---')) {
      flushList(key)
      elements.push(
        <hr key={key} className="my-5" style={{ borderColor: 'var(--color-border)' }} />,
      )
    } else if (/^\d+\.\s/.test(line)) {
      if (listType !== 'ol') {
        flushList(key)
        listType = 'ol'
      }
      listItems.push(line.replace(/^\d+\.\s/, ''))
    } else if (line.startsWith('- ')) {
      if (listType !== 'ul') {
        flushList(key)
        listType = 'ul'
      }
      listItems.push(line.slice(2))
    } else if (line.startsWith('**')) {
      flushList(key)
      const match = line.match(/^\*\*(.+?):\*\*\s*(.*)/)
      if (match) {
        elements.push(
          <p
            key={key}
            className="text-[14px] mb-2 leading-relaxed"
            style={{ color: 'var(--color-text-body)' }}
          >
            <strong style={{ color: 'var(--color-text-heading)' }}>{match[1]}:</strong>{' '}
            <span style={{ color: 'var(--color-text-secondary)' }}>{match[2]}</span>
          </p>,
        )
      } else if (line.endsWith('**') && line.length > 4) {
        elements.push(
          <p
            key={key}
            className="text-[14px] mb-2 font-semibold leading-relaxed"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {line.slice(2, -2)}
          </p>,
        )
      } else {
        elements.push(
          <p
            key={key}
            className="text-[14px] leading-relaxed mb-3"
            style={{ color: 'var(--color-text-body)' }}
          >
            {line}
          </p>,
        )
      }
    } else if (line.trim() === '') {
      flushList(key)
      elements.push(<div key={key} className="h-2" />)
    } else {
      flushList(key)
      elements.push(
        <p
          key={key}
          className="text-[14px] leading-relaxed mb-3"
          style={{ color: 'var(--color-text-body)' }}
        >
          {line}
        </p>,
      )
    }
  })

  flushList('end')
  return elements
}

export function PortalDocumentViewer({
  document: doc,
  onClose,
}: PortalDocumentViewerProps) {
  const config = TYPE_CONFIG[doc.type]

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-stretch sm:items-start justify-center sm:pt-10 sm:pb-10 p-0 sm:px-4">
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(26,16,8,0.70)' }}
        onClick={onClose}
      />

      <div
        className="relative z-10 flex flex-col w-full h-full sm:h-auto overflow-hidden sm:rounded-[14px]"
        style={{
          maxWidth: '560px',
          maxHeight: '100dvh',
          background: '#FFFFFF',
          boxShadow: '0 24px 80px rgba(26,16,8,0.24)',
        }}
      >
        <div
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3.5 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: config.iconBg, color: config.iconColor }}
          >
            {config.icon}
          </div>

          <span
            className="flex-1 text-[14px] font-semibold truncate"
            style={{ color: 'var(--color-text-heading)' }}
          >
            {doc.title}
          </span>

          <button
            type="button"
            className="flex items-center gap-1.5 h-[30px] px-3 rounded-lg border text-[12px] font-medium transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-secondary)',
            }}
          >
            <DownloadCloud size={13} />
            Download
          </button>

          <button
            type="button"
            onClick={onClose}
            className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-muted)' }}
          >
            <X size={15} />
          </button>
        </div>

        <div
          className="flex-1 overflow-y-auto"
          style={{ background: '#F5F5F5', padding: '24px' }}
        >
          <div
            className="mx-auto"
            style={{
              background: '#FAFAF8',
              borderRadius: '10px',
              boxShadow: '0 2px 12px rgba(26,16,8,0.08)',
              padding: '40px 48px',
              minHeight: '400px',
            }}
          >
            {renderContent(doc.content)}

            <div
              className="mt-10 pt-5 text-center text-[11px]"
              style={{
                borderTop: '1px solid var(--color-border)',
                color: 'var(--color-text-muted)',
              }}
            >
              Sent by Forgex Team · {doc.sentDate}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
