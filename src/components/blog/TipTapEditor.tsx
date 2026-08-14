'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import Link from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import { useEffect, type ReactNode } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Code,
  Minus,
  Link as LinkIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'

interface TipTapEditorProps {
  content: Record<string, unknown> | null
  onChange: (content: Record<string, unknown>) => void
  placeholder?: string
  editable?: boolean
}

export function TipTapEditor({
  content,
  onChange,
  placeholder = 'Start writing your post...',
  editable = true,
}: TipTapEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        underline: false,
        link: false,
      }),
      Underline,
      Placeholder.configure({ placeholder }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: { class: 'text-[var(--color-accent)] underline' },
      }),
    ],
    content: content ?? undefined,
    editable,
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getJSON() as Record<string, unknown>)
    },
    editorProps: {
      attributes: {
        class:
          'prose prose-neutral max-w-none outline-none min-h-[400px] text-[16px] leading-relaxed',
      },
    },
  })

  useEffect(() => {
    if (!editor) return
    if (content === null) {
      editor.commands.clearContent()
      return
    }
    const current = JSON.stringify(editor.getJSON())
    const next = JSON.stringify(content)
    if (current === next) return
    editor.commands.setContent(content, { emitUpdate: false })
  }, [editor, content])

  if (!editor) return null

  const ToolbarButton = ({
    onClick,
    active,
    children,
    title,
  }: {
    onClick: () => void
    active?: boolean
    children: ReactNode
    title: string
  }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={cn(
        'flex items-center justify-center w-8 h-8 rounded-lg transition-colors',
        active
          ? 'bg-[var(--color-accent)] text-white'
          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-hover)]',
      )}
    >
      {children}
    </button>
  )

  const setLink = () => {
    const url = window.prompt('Enter URL')
    if (url) {
      editor.chain().focus().setLink({ href: url }).run()
    } else {
      editor.chain().focus().unsetLink().run()
    }
  }

  return (
    <div>
      {editable && (
        <div
          className="flex items-center gap-0.5 mb-4 pb-3 border-b flex-wrap"
          style={{ borderColor: 'var(--color-border)' }}
        >
          <ToolbarButton
            title="Bold"
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive('bold')}
          >
            <Bold size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Italic"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive('italic')}
          >
            <Italic size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Underline"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            active={editor.isActive('underline')}
          >
            <UnderlineIcon size={15} />
          </ToolbarButton>
          <div
            className="w-px h-5 mx-1"
            style={{ background: 'var(--color-border)' }}
          />
          <ToolbarButton
            title="Heading 1"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 1 }).run()
            }
            active={editor.isActive('heading', { level: 1 })}
          >
            <Heading1 size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 2"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 2 }).run()
            }
            active={editor.isActive('heading', { level: 2 })}
          >
            <Heading2 size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Heading 3"
            onClick={() =>
              editor.chain().focus().toggleHeading({ level: 3 }).run()
            }
            active={editor.isActive('heading', { level: 3 })}
          >
            <Heading3 size={15} />
          </ToolbarButton>
          <div
            className="w-px h-5 mx-1"
            style={{ background: 'var(--color-border)' }}
          />
          <ToolbarButton
            title="Bullet List"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive('bulletList')}
          >
            <List size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Ordered List"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive('orderedList')}
          >
            <ListOrdered size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Blockquote"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            active={editor.isActive('blockquote')}
          >
            <Quote size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Code"
            onClick={() => editor.chain().focus().toggleCode().run()}
            active={editor.isActive('code')}
          >
            <Code size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Link"
            onClick={setLink}
            active={editor.isActive('link')}
          >
            <LinkIcon size={15} />
          </ToolbarButton>
          <ToolbarButton
            title="Divider"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
          >
            <Minus size={15} />
          </ToolbarButton>
        </div>
      )}
      <EditorContent editor={editor} />
    </div>
  )
}
