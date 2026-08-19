'use client'

import { useState, useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X, DownloadCloud, ZoomIn, ZoomOut } from 'lucide-react'

export interface ViewerFile {
  id: string
  name: string
  url: string
  mimeType: string
  size?: string
  uploadedBy?: string
  docContent?: string
  htmlContent?: string
}

interface FileViewerProps {
  file: ViewerFile | null
  onClose: () => void
}

function getFileCategory(
  mimeType: string,
  fileName = '',
): 'pdf' | 'image' | 'video' | 'audio' | 'doc' | 'markdown' | 'html' | 'unknown' {
  if (mimeType === 'application/pdf') return 'pdf'
  if (mimeType.startsWith('image/')) return 'image'
  if (mimeType.startsWith('video/')) return 'video'
  if (mimeType.startsWith('audio/')) return 'audio'
  if (mimeType === 'text/html') return 'html'
  const lowerName = fileName.toLowerCase()
  if (
    mimeType === 'text/markdown' ||
    mimeType === 'text/plain' ||
    mimeType === 'application/x-markdown' ||
    mimeType === '' ||
    lowerName.endsWith('.md') ||
    lowerName.endsWith('.markdown') ||
    lowerName.endsWith('.txt')
  )
    return 'markdown'
  if (
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('spreadsheet') ||
    mimeType.includes('powerpoint') ||
    mimeType.includes('presentation') ||
    mimeType.includes('opendocument')
  )
    return 'doc'
  return 'unknown'
}

function getFileIcon(mimeType: string): string {
  if (mimeType === 'application/pdf') return '📄'
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎬'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation'))
    return '📋'
  return '📎'
}

function getGoogleViewerUrl(fileUrl: string): string {
  return `https://docs.google.com/viewer?url=${encodeURIComponent(fileUrl)}&embedded=true`
}

function PdfViewer({ url }: { url: string }) {
  return (
    <iframe
      src={`${url}#toolbar=1&navpanes=0&scrollbar=1`}
      className="w-full h-full border-0"
      title="PDF Viewer"
      allow="fullscreen"
    />
  )
}

function ImageViewer({ url, name }: { url: string; name: string }) {
  const [zoom, setZoom] = useState(1)
  const [dragging, setDragging] = useState(false)
  const [pos, setPos] = useState({ x: 0, y: 0 })
  const [startPos, setStartPos] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLDivElement>(null)

  const zoomIn = () => setZoom((z) => Math.min(z + 0.25, 4))
  const zoomOut = () => setZoom((z) => Math.max(z - 0.25, 0.25))
  const reset = () => {
    setZoom(1)
    setPos({ x: 0, y: 0 })
  }

  return (
    <div className="flex flex-col h-full">
      <div
        className="flex items-center justify-center gap-2 py-2 shrink-0"
        style={{ borderBottom: '1px solid var(--color-border)' }}
      >
        <button
          type="button"
          onClick={zoomOut}
          disabled={zoom <= 0.25}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-40"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ZoomOut size={14} />
        </button>
        <button
          type="button"
          onClick={reset}
          className="text-[12px] font-medium w-14 text-center hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={zoomIn}
          disabled={zoom >= 4}
          className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)] disabled:opacity-40"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ZoomIn size={14} />
        </button>
      </div>

      <div
        ref={imgRef}
        className="flex-1 overflow-hidden flex items-center justify-center cursor-grab active:cursor-grabbing"
        style={{ background: '#2A2A2A' }}
        onMouseDown={(e) => {
          if (zoom <= 1) return
          setDragging(true)
          setStartPos({ x: e.clientX - pos.x, y: e.clientY - pos.y })
        }}
        onMouseMove={(e) => {
          if (!dragging) return
          setPos({ x: e.clientX - startPos.x, y: e.clientY - startPos.y })
        }}
        onMouseUp={() => setDragging(false)}
        onMouseLeave={() => setDragging(false)}
        onDoubleClick={() => (zoom === 1 ? zoomIn() : reset())}
      >
        <img
          src={url}
          alt={name}
          style={{
            transform: `scale(${zoom}) translate(${pos.x / zoom}px, ${pos.y / zoom}px)`,
            transition: dragging ? 'none' : 'transform 0.2s ease',
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            userSelect: 'none',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
          draggable={false}
        />
      </div>

      <p
        className="text-center text-[11px] py-2 shrink-0"
        style={{ color: 'rgba(255,255,255,0.4)' }}
      >
        Double-click to zoom · Drag to pan
      </p>
    </div>
  )
}

function VideoViewer({ url }: { url: string; name: string }) {
  return (
    <div
      className="flex items-center justify-center h-full"
      style={{ background: '#000' }}
    >
      <video
        src={url}
        controls
        autoPlay={false}
        className="max-w-full max-h-full"
        style={{ outline: 'none' }}
      >
        <track kind="captions" />
        Your browser does not support video playback.
      </video>
    </div>
  )
}

function AudioViewer({ url, name }: { url: string; name: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-6"
      style={{ background: 'var(--color-page)' }}
    >
      <div
        className="w-24 h-24 rounded-2xl flex items-center justify-center text-[48px]"
        style={{ background: 'var(--color-surface-hover)' }}
      >
        🎵
      </div>
      <div className="text-center">
        <p
          className="text-[15px] font-semibold mb-1"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {name}
        </p>
      </div>
      <audio src={url} controls className="w-full max-w-[320px]">
        Your browser does not support audio playback.
      </audio>
    </div>
  )
}

function DocViewer({ url, name }: { url: string; name?: string }) {
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1')

  if (isLocalhost) {
    return (
      <div
        className="flex flex-col items-center justify-center h-full gap-5 text-center px-8"
        style={{ background: 'var(--color-page)' }}
      >
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center text-[36px]"
          style={{ background: 'var(--color-surface-hover)' }}
        >
          📝
        </div>
        <div>
          <p
            className="text-[15px] font-semibold mb-2"
            style={{ color: 'var(--color-text-heading)' }}
          >
            Preview unavailable on localhost
          </p>
          <p
            className="text-[13px] max-w-[320px] leading-relaxed"
            style={{ color: 'var(--color-text-muted)' }}
          >
            Office documents use Google Docs Viewer which requires a public URL.
            This will work correctly in production. Download to view locally.
          </p>
        </div>
        <a
          href={url}
          download={name}
          className="flex items-center gap-2 h-[42px] px-5 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-accent)' }}
        >
          <DownloadCloud size={15} />
          Download to view
        </a>
      </div>
    )
  }

  return (
    <iframe
      src={getGoogleViewerUrl(url)}
      className="w-full h-full border-0"
      title="Document Viewer"
      sandbox="allow-scripts allow-same-origin allow-popups"
    />
  )
}

function HtmlViewer({ content, url }: { content?: string; url?: string }) {
  if (content) {
    return (
      <iframe
        srcDoc={content}
        className="w-full h-full border-0"
        title="HTML Viewer"
        sandbox="allow-scripts"
      />
    )
  }
  return (
    <iframe
      src={url}
      className="w-full h-full border-0"
      title="HTML Viewer"
      sandbox="allow-scripts allow-same-origin"
    />
  )
}

function MarkdownViewer({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: ReactNode[] = []
  let listItems: string[] = []
  let listType: 'ol' | 'ul' | null = null

  const inlineFormat = (text: string): string =>
    text
      .replace(
        /\*\*(.+?)\*\*/g,
        '<strong style="color:var(--color-text-heading)">$1</strong>',
      )
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(
        /`(.+?)`/g,
        '<code style="background:var(--color-surface-hover);padding:2px 6px;border-radius:4px;font-size:13px;font-family:monospace">$1</code>',
      )
      .replace(
        /\[(.+?)\]\((.+?)\)/g,
        '<a href="$2" style="color:var(--color-accent);text-decoration:underline" target="_blank">$1</a>',
      )

  const flushList = (key: string) => {
    if (!listItems.length) return
    if (listType === 'ol') {
      elements.push(
        <ol key={`list-${key}`} className="list-none pl-0 mb-4 space-y-1.5">
          {listItems.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[15px] leading-relaxed"
              style={{ color: 'var(--color-text-body)' }}
            >
              <span
                className="font-semibold shrink-0 mt-0.5"
                style={{ color: 'var(--color-accent)' }}
              >
                {i + 1}.
              </span>
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ol>,
      )
    } else {
      elements.push(
        <ul key={`list-${key}`} className="list-none pl-0 mb-4 space-y-1.5">
          {listItems.map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-[15px] leading-relaxed"
              style={{ color: 'var(--color-text-body)' }}
            >
              <span
                className="mt-2.5 w-1.5 h-1.5 rounded-full shrink-0"
                style={{ background: 'var(--color-accent)' }}
              />
              <span dangerouslySetInnerHTML={{ __html: inlineFormat(item) }} />
            </li>
          ))}
        </ul>,
      )
    }
    listItems = []
    listType = null
  }

  lines.forEach((line, idx) => {
    const key = `${idx}`
    if (line.startsWith('# ')) {
      flushList(key)
      elements.push(
        <h1
          key={key}
          className="text-[26px] font-bold mb-3 mt-0 leading-tight"
          style={{ color: 'var(--color-text-heading)', letterSpacing: '-0.02em' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }}
        />,
      )
    } else if (line.startsWith('## ')) {
      flushList(key)
      elements.push(
        <h2
          key={key}
          className="text-[19px] font-semibold mb-2 mt-6"
          style={{ color: 'var(--color-text-heading)' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(3)) }}
        />,
      )
    } else if (line.startsWith('### ')) {
      flushList(key)
      elements.push(
        <h3
          key={key}
          className="text-[16px] font-semibold mb-2 mt-5"
          style={{ color: 'var(--color-text-heading)' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(4)) }}
        />,
      )
    } else if (line.startsWith('#### ')) {
      flushList(key)
      elements.push(
        <h4
          key={key}
          className="text-[14px] font-semibold mb-1 mt-4"
          style={{ color: 'var(--color-text-heading)' }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(5)) }}
        />,
      )
    } else if (line.startsWith('> ')) {
      flushList(key)
      elements.push(
        <blockquote
          key={key}
          className="border-l-[3px] pl-4 py-1 mb-3 italic"
          style={{
            borderColor: 'var(--color-accent)',
            color: 'var(--color-text-secondary)',
          }}
          dangerouslySetInnerHTML={{ __html: inlineFormat(line.slice(2)) }}
        />,
      )
    } else if (line.match(/^---+$/)) {
      flushList(key)
      elements.push(
        <hr key={key} className="my-6" style={{ borderColor: 'var(--color-border)' }} />,
      )
    } else if (/^\d+\.\s/.test(line)) {
      if (listType !== 'ol') {
        flushList(key)
        listType = 'ol'
      }
      listItems.push(line.replace(/^\d+\.\s/, ''))
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      if (listType !== 'ul') {
        flushList(key)
        listType = 'ul'
      }
      listItems.push(line.slice(2))
    } else if (line.startsWith('```')) {
      flushList(key)
    } else if (line.trim() === '') {
      flushList(key)
      elements.push(<div key={key} className="h-3" />)
    } else {
      flushList(key)
      const isBoldLabel = line.match(/^\*\*(.+?):\*\*\s*(.*)/)
      if (isBoldLabel) {
        elements.push(
          <p
            key={key}
            className="text-[15px] mb-2 leading-relaxed"
            style={{ color: 'var(--color-text-body)' }}
          >
            <strong style={{ color: 'var(--color-text-heading)' }}>
              {isBoldLabel[1]}:
            </strong>{' '}
            <span
              dangerouslySetInnerHTML={{
                __html: inlineFormat(isBoldLabel[2] ?? ''),
              }}
            />
          </p>,
        )
      } else {
        elements.push(
          <p
            key={key}
            className="text-[15px] leading-relaxed mb-3"
            style={{ color: 'var(--color-text-body)' }}
            dangerouslySetInnerHTML={{ __html: inlineFormat(line) }}
          />,
        )
      }
    }
  })
  flushList('end')

  return (
    <div
      className="h-full overflow-y-auto"
      style={{ background: '#F5F5F5', padding: '24px' }}
    >
      <div
        style={{
          background: '#FAFAF8',
          borderRadius: '12px',
          boxShadow: '0 2px 16px rgba(26,16,8,0.08)',
          padding: '48px 60px',
          maxWidth: '720px',
          margin: '0 auto',
          minHeight: '100%',
        }}
      >
        {elements}
        <div
          className="mt-10 pt-5 text-center text-[11px]"
          style={{
            borderTop: '1px solid var(--color-border)',
            color: 'var(--color-text-muted)',
          }}
        />
      </div>
    </div>
  )
}

function UnknownViewer({ file }: { file: ViewerFile }) {
  return (
    <div
      className="flex flex-col items-center justify-center h-full gap-5 text-center px-8"
      style={{ background: 'var(--color-page)' }}
    >
      <div
        className="w-20 h-20 rounded-2xl flex items-center justify-center text-[40px]"
        style={{ background: 'var(--color-surface-hover)' }}
      >
        {getFileIcon(file.mimeType)}
      </div>
      <div>
        <p
          className="text-[16px] font-semibold mb-2"
          style={{ color: 'var(--color-text-heading)' }}
        >
          {file.name}
        </p>
        <p
          className="text-[14px] max-w-[320px] leading-relaxed"
          style={{ color: 'var(--color-text-muted)' }}
        >
          This file type cannot be previewed in the browser. Download it to open
          with the appropriate application.
        </p>
      </div>
      <a
        href={file.url}
        download={file.name}
        className="flex items-center gap-2 h-[44px] px-6 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
        style={{ background: 'var(--color-accent)' }}
      >
        <DownloadCloud size={16} />
        Download {file.name}
      </a>
    </div>
  )
}

export function FileViewer({ file, onClose }: FileViewerProps) {
  const [fetchedContent, setFetchedContent] = useState<string | null>(null)
  const [fetchLoading, setFetchLoading] = useState(false)
  const justOpenedRef = useRef(false)
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  useEffect(() => {
    if (!file) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handler)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', handler)
      document.body.style.overflow = ''
    }
  }, [file, onClose])

  useEffect(() => {
    if (!file) return
    // Mark as just opened — ignore the first click that opened us
    justOpenedRef.current = true
    const t = setTimeout(() => {
      justOpenedRef.current = false
    }, 100)
    return () => clearTimeout(t)
  }, [file])

  useEffect(() => {
    if (!file) return
    setFetchedContent(null)

    const category = getFileCategory(file.mimeType, file.name)

    if (file.docContent) {
      setFetchedContent(file.docContent)
      return
    }

    if (category === 'markdown' && file.url && file.url !== '#') {
      let cancelled = false
      setFetchLoading(true)
      fetch(file.url)
        .then((res) => res.text())
        .then((text) => {
          if (cancelled) return
          setFetchedContent(text)
          setFetchLoading(false)
        })
        .catch(() => {
          if (cancelled) return
          setFetchedContent(null)
          setFetchLoading(false)
        })
      return () => {
        cancelled = true
      }
    }
  }, [file])

  if (!file || !mounted) return null

  const category = getFileCategory(file.mimeType, file.name)

  const renderContent = () => {
    if (fetchLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <span className="w-5 h-5 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
      )
    }

    if (fetchedContent || file.docContent) {
      return (
        <MarkdownViewer content={fetchedContent ?? file.docContent ?? ''} />
      )
    }

    if (file.htmlContent) return <HtmlViewer content={file.htmlContent} />

    switch (category) {
      case 'pdf':
        return <PdfViewer url={file.url} />
      case 'image':
        return <ImageViewer url={file.url} name={file.name} />
      case 'video':
        return <VideoViewer url={file.url} name={file.name} />
      case 'audio':
        return <AudioViewer url={file.url} name={file.name} />
      case 'html':
        return <HtmlViewer url={file.url} />
      case 'doc':
        return <DocViewer url={file.url} name={file.name} />
      case 'markdown':
        return <UnknownViewer file={file} />
      default:
        return <UnknownViewer file={file} />
    }
  }

  const canDownload =
    Boolean(file.docContent?.trim()) ||
    (Boolean(file.url) && file.url !== '#')

  const handleDownload = async () => {
    const base = file.name.replace(/[<>:"/\\|?*\u0000-\u001f]+/g, ' ').trim() || 'document'
    if (file.docContent?.trim()) {
      const filename = base.toLowerCase().endsWith('.md') ? base : `${base}.md`
      const url = URL.createObjectURL(
        new Blob([file.docContent], { type: 'text/markdown;charset=utf-8' }),
      )
      const link = document.createElement('a')
      link.href = url
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(url), 1000)
      return
    }
    if (!file.url || file.url === '#') return
    const ext = file.mimeType === 'application/pdf' ? 'pdf' : ''
    const filename = ext && !base.toLowerCase().endsWith(`.${ext}`) ? `${base}.${ext}` : base
    try {
      const res = await fetch(file.url)
      if (!res.ok) throw new Error('download failed')
      const src = await res.blob()
      const blobUrl = URL.createObjectURL(
        new Blob([src], { type: 'application/octet-stream' }),
      )
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 1500)
    } catch {
      return
    }
  }
  const bg =
    category === 'image' || category === 'video'
      ? '#1A1008'
      : 'var(--color-page)'

  return createPortal(
    <div
      className="fixed inset-0 z-[400] flex items-center justify-center p-0 sm:p-4"
    >
      {/* Backdrop — separate from content, handles close */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(26,16,8,0.80)',
        }}
        onMouseDown={onClose}
      />

      {/* Viewer panel — stops all events from reaching backdrop */}
      <div
        className="relative z-10 flex flex-col overflow-hidden w-full h-full sm:w-[90vw] sm:h-[90vh] sm:max-w-[1000px] sm:rounded-2xl"
        style={{
          background: 'var(--color-surface)',
          boxShadow: '0 32px 80px rgba(26,16,8,0.28)',
          pointerEvents: 'auto',
        }}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="flex items-center gap-2 sm:gap-3 px-3 sm:px-5 py-3 sm:py-3.5 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)' }}
        >
          <span className="text-[18px] shrink-0">{getFileIcon(file.mimeType)}</span>

          <div className="flex-1 min-w-0">
            <p
              className="text-[14px] font-semibold truncate"
              style={{ color: 'var(--color-text-heading)' }}
            >
              {file.name}
            </p>
            {(file.size ?? file.uploadedBy) && (
              <p className="text-[11px]" style={{ color: 'var(--color-text-muted)' }}>
                {[file.size, file.uploadedBy ? `by ${file.uploadedBy}` : null]
                  .filter(Boolean)
                  .join(' · ')}
              </p>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {canDownload && (
              <button
                type="button"
                onClick={() => void handleDownload()}
                className="flex items-center justify-center gap-1.5 h-8 w-8 sm:h-[32px] sm:w-auto sm:px-3 rounded-lg border text-[12px] font-medium transition-colors hover:bg-[var(--color-surface-hover)]"
                style={{
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-secondary)',
                }}
                aria-label="Download"
              >
                <DownloadCloud size={13} />
                <span className="hidden sm:inline">Download</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
              style={{ color: 'var(--color-text-muted)' }}
            >
              <X size={15} />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 min-h-0" style={{ background: bg }}>
          {renderContent()}
        </div>
      </div>
    </div>,
    document.body,
  )
}
