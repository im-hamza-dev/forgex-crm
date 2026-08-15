'use client'

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useCallback,
  type KeyboardEvent,
  type ReactNode,
} from 'react'
import {
  Bold,
  Italic,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Minus,
  Link as LinkIcon,
  Table as TableIcon,
  Undo,
  Redo,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface RichDocEditorProps {
  content: Record<string, unknown> | null
  onChange: (content: Record<string, unknown>) => void
  placeholder?: string
  editable?: boolean
}

export interface RichDocEditorHandle {
  insertMarkdown: (markdown: string) => void
  insertContent: (content: Record<string, unknown>) => void
  getContent: () => Record<string, unknown> | null
}

export function markdownToDoc(markdown: string): Record<string, unknown> {
  return { type: 'markdown', body: markdown }
}

export function docToMarkdown(content: Record<string, unknown> | null): string {
  if (!content) return ''
  if (content.type === 'markdown' && typeof content.body === 'string') {
    return content.body
  }
  return '__LEGACY_TIPTAP__'
}

export const RichDocEditor = forwardRef<RichDocEditorHandle, RichDocEditorProps>(
  function RichDocEditor(
    {
      content,
      onChange,
      placeholder = 'Start writing in Markdown...',
      editable = true,
    },
    ref,
  ) {
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const historyRef = useRef<string[]>([])
    const historyIndexRef = useRef(-1)
    const suppressHistoryRef = useRef(false)

    const markdown = docToMarkdown(content)
    const isLegacy = markdown === '__LEGACY_TIPTAP__'

    const pushHistory = useCallback((value: string) => {
      if (suppressHistoryRef.current) return
      const stack = historyRef.current
      historyRef.current = stack.slice(0, historyIndexRef.current + 1)
      historyRef.current.push(value)
      historyIndexRef.current = historyRef.current.length - 1
    }, [])

    const handleChange = useCallback(
      (value: string) => {
        pushHistory(value)
        onChange(markdownToDoc(value))
      },
      [onChange, pushHistory],
    )

    useEffect(() => {
      const ta = textareaRef.current
      if (!ta) return
      const current = ta.value
      const next = isLegacy ? '' : markdown
      if (current !== next) {
        ta.value = next
        if (historyRef.current.length === 0) {
          historyRef.current = [next]
          historyIndexRef.current = 0
        }
      }
    }, [markdown, isLegacy])

    const getValue = () => textareaRef.current?.value ?? ''

    const applyWrap = useCallback(
      (before: string, after: string) => {
        const ta = textareaRef.current
        if (!ta || !editable) return
        const start = ta.selectionStart
        const end = ta.selectionEnd
        const selected = ta.value.slice(start, end)
        const wrapped = `${before}${selected}${after}`
        const next = ta.value.slice(0, start) + wrapped + ta.value.slice(end)
        ta.value = next
        ta.selectionStart = start + before.length
        ta.selectionEnd = start + before.length + selected.length
        ta.focus()
        handleChange(next)
      },
      [editable, handleChange],
    )

    const applyLinePrefix = useCallback(
      (prefix: string) => {
        const ta = textareaRef.current
        if (!ta || !editable) return
        const start = ta.selectionStart
        const lineStart = ta.value.lastIndexOf('\n', start - 1) + 1
        const alreadyHas = ta.value.slice(lineStart).startsWith(prefix)
        let next: string
        if (alreadyHas) {
          next =
            ta.value.slice(0, lineStart) +
            ta.value.slice(lineStart + prefix.length)
        } else {
          next =
            ta.value.slice(0, lineStart) + prefix + ta.value.slice(lineStart)
        }
        ta.value = next
        ta.selectionStart = start + (alreadyHas ? -prefix.length : prefix.length)
        ta.selectionEnd = ta.selectionStart
        ta.focus()
        handleChange(next)
      },
      [editable, handleChange],
    )

    const insertAtCursor = useCallback(
      (text: string) => {
        const ta = textareaRef.current
        if (!ta || !editable) return
        const start = ta.selectionStart
        const next =
          ta.value.slice(0, start) + text + ta.value.slice(ta.selectionEnd)
        ta.value = next
        ta.selectionStart = start + text.length
        ta.selectionEnd = start + text.length
        ta.focus()
        handleChange(next)
      },
      [editable, handleChange],
    )

    const undo = useCallback(() => {
      if (historyIndexRef.current <= 0) return
      historyIndexRef.current -= 1
      const value = historyRef.current[historyIndexRef.current] ?? ''
      suppressHistoryRef.current = true
      if (textareaRef.current) textareaRef.current.value = value
      onChange(markdownToDoc(value))
      suppressHistoryRef.current = false
    }, [onChange])

    const redo = useCallback(() => {
      if (historyIndexRef.current >= historyRef.current.length - 1) return
      historyIndexRef.current += 1
      const value = historyRef.current[historyIndexRef.current] ?? ''
      suppressHistoryRef.current = true
      if (textareaRef.current) textareaRef.current.value = value
      onChange(markdownToDoc(value))
      suppressHistoryRef.current = false
    }, [onChange])

    useImperativeHandle(
      ref,
      () => ({
        insertMarkdown: (md: string) => {
          const ta = textareaRef.current
          if (!ta) return
          ta.value = md
          handleChange(md)
        },
        insertContent: (c: Record<string, unknown>) => {
          const md = docToMarkdown(c)
          if (md === '__LEGACY_TIPTAP__') return
          const ta = textareaRef.current
          if (!ta) return
          ta.value = md
          handleChange(md)
        },
        getContent: () => markdownToDoc(getValue()),
      }),
      [handleChange],
    )

    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        insertAtCursor('  ')
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
        return
      }
      if (
        (e.ctrlKey || e.metaKey) &&
        (e.key === 'y' || (e.key === 'z' && e.shiftKey))
      ) {
        e.preventDefault()
        redo()
        return
      }
    }

    const ToolBtn = ({
      onClick,
      title,
      children,
    }: {
      onClick: () => void
      title: string
      children: ReactNode
    }) => (
      <button
        type="button"
        title={title}
        onMouseDown={(e) => {
          e.preventDefault()
          onClick()
        }}
        className="flex items-center justify-center w-7 h-7 rounded-md transition-colors text-[13px] text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]"
      >
        {children}
      </button>
    )

    const Divider = () => (
      <span
        className="w-px h-5 mx-0.5 shrink-0"
        style={{ background: 'var(--color-border)' }}
      />
    )

    return (
      <div className="flex flex-col docs-editor">
        {editable && (
          <div
            className="flex items-center gap-0.5 pb-2 mb-4 border-b flex-wrap py-1.5 px-0"
            style={{ borderColor: 'var(--color-border)' }}
          >
            <ToolBtn title="Undo" onClick={undo}>
              <Undo size={13} />
            </ToolBtn>
            <ToolBtn title="Redo" onClick={redo}>
              <Redo size={13} />
            </ToolBtn>
            <Divider />
            <ToolBtn title="Bold" onClick={() => applyWrap('**', '**')}>
              <Bold size={13} />
            </ToolBtn>
            <ToolBtn title="Italic" onClick={() => applyWrap('*', '*')}>
              <Italic size={13} />
            </ToolBtn>
            <ToolBtn title="Strikethrough" onClick={() => applyWrap('~~', '~~')}>
              <Strikethrough size={13} />
            </ToolBtn>
            <Divider />
            <ToolBtn title="Heading 1" onClick={() => applyLinePrefix('# ')}>
              <Heading1 size={13} />
            </ToolBtn>
            <ToolBtn title="Heading 2" onClick={() => applyLinePrefix('## ')}>
              <Heading2 size={13} />
            </ToolBtn>
            <ToolBtn title="Heading 3" onClick={() => applyLinePrefix('### ')}>
              <Heading3 size={13} />
            </ToolBtn>
            <Divider />
            <ToolBtn title="Bullet List" onClick={() => applyLinePrefix('- ')}>
              <List size={13} />
            </ToolBtn>
            <ToolBtn title="Ordered List" onClick={() => applyLinePrefix('1. ')}>
              <ListOrdered size={13} />
            </ToolBtn>
            <ToolBtn title="Task List" onClick={() => applyLinePrefix('- [ ] ')}>
              <CheckSquare size={13} />
            </ToolBtn>
            <Divider />
            <ToolBtn title="Blockquote" onClick={() => applyLinePrefix('> ')}>
              <Quote size={13} />
            </ToolBtn>
            <ToolBtn title="Inline Code" onClick={() => applyWrap('`', '`')}>
              <Code size={13} />
            </ToolBtn>
            <ToolBtn
              title="Horizontal Rule"
              onClick={() => insertAtCursor('\n---\n')}
            >
              <Minus size={13} />
            </ToolBtn>
            <ToolBtn title="Link" onClick={() => applyWrap('[', '](url)')}>
              <LinkIcon size={13} />
            </ToolBtn>
            <ToolBtn
              title="Table"
              onClick={() =>
                insertAtCursor(
                  '\n| Column 1 | Column 2 | Column 3 |\n| --- | --- | --- |\n| Cell | Cell | Cell |\n',
                )
              }
            >
              <TableIcon size={13} />
            </ToolBtn>
          </div>
        )}

        {isLegacy ? (
          <div
            className="rounded-lg border px-4 py-3 text-[13px]"
            style={{
              borderColor: 'var(--color-border)',
              color: 'var(--color-text-muted)',
              background: 'var(--color-surface-hover)',
            }}
          >
            This document was created with the old editor. It is view-only here.
            Open Preview to read it.
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            defaultValue={markdown}
            readOnly={!editable}
            placeholder={placeholder}
            onKeyDown={handleKeyDown}
            onChange={(e) => handleChange(e.target.value)}
            className={cn(
              'w-full min-h-[600px] resize-none outline-none font-mono text-[14px] leading-relaxed bg-transparent',
              !editable && 'cursor-default select-text',
            )}
            style={{ color: 'var(--color-text-body)' }}
            spellCheck
          />
        )}
      </div>
    )
  },
)
