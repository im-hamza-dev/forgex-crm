'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Bold,
  Italic,
  Heading1,
  Heading2,
  Quote,
  Code,
  List,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout'
import { ROUTES } from '@/constants/routes'
import { BlogEditorHeader } from './BlogEditorHeader'
import { BlogSeoPanel } from './BlogSeoPanel'
import type { BlogPost, BlogPostStatus } from '@/types/blog'

interface BlogEditorProps {
  post?: BlogPost | null
}

export function BlogEditor({ post }: BlogEditorProps) {
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(true)
  const [title, setTitle] = useState(post?.title ?? '')
  const [body, setBody] = useState(post?.body ?? '')
  const [status, setStatus] = useState<BlogPostStatus>(post?.status ?? 'draft')
  const [seoTitle, setSeoTitle] = useState(post?.seo_title ?? '')
  const [seoDesc, setSeoDesc] = useState(post?.seo_description ?? '')
  const [category, setCategory] = useState(post?.category ?? '')
  const [allowComments, setAllowComments] = useState(
    post?.allow_comments ?? true,
  )
  const [ogIsCover, setOgIsCover] = useState(true)
  const titleRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [title])

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-page)' }}>
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        userName="Hamza Iqbal"
        userRole="admin"
        userAvatarUrl={null}
        notificationCount={3}
        onSignOut={() => router.push(ROUTES.LOGIN)}
      />

      <div
        className={cn(
          'flex flex-col h-screen',
          'transition-[padding] duration-200 ease-in-out',
          collapsed ? 'pl-[56px]' : 'pl-[240px]',
        )}
      >
        <BlogEditorHeader
          status={status}
          onStatusChange={setStatus}
          onSaveDraft={() => console.log('Save draft')}
          onPublish={() => console.log('Publish')}
        />

        <div
          className="flex flex-1 overflow-hidden"
          style={{ background: 'var(--color-page)' }}
        >
          <div
            className="flex-1 overflow-y-auto"
            style={{ background: 'var(--color-surface)' }}
          >
            <div className="max-w-[720px] mx-auto px-10 pt-10 pb-20">
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Post title..."
                rows={1}
                className={cn(
                  'w-full resize-none bg-transparent border-none outline-none',
                  'text-[28px] font-bold leading-tight mb-6',
                  'placeholder:text-[var(--color-text-disabled)]',
                )}
                style={{ color: 'var(--color-text-heading)' }}
              />

              <div
                className={cn(
                  'w-full rounded-xl border-2 border-dashed mb-6',
                  'flex items-center justify-center cursor-pointer',
                  'transition-colors hover:border-[var(--color-accent)]',
                )}
                style={{
                  height: '200px',
                  borderColor: 'var(--color-accent-border)',
                  background: 'var(--color-accent-subtle)',
                }}
                onClick={() => console.log('Upload cover')}
              >
                <p
                  className="text-[14px]"
                  style={{ color: 'var(--color-text-muted)' }}
                >
                  Upload cover image
                </p>
              </div>

              <div
                className="flex items-center gap-0.5 mb-4 pb-3 border-b"
                style={{ borderColor: 'var(--color-border)' }}
              >
                {[
                  { icon: <Bold size={15} />, label: 'Bold' },
                  { icon: <Italic size={15} />, label: 'Italic' },
                  { icon: <Heading1 size={15} />, label: 'Heading 1' },
                  { icon: <Heading2 size={15} />, label: 'Heading 2' },
                  { icon: <Quote size={15} />, label: 'Quote' },
                  { icon: <Code size={15} />, label: 'Code' },
                  { icon: <List size={15} />, label: 'List' },
                ].map((btn) => (
                  <button
                    type="button"
                    key={btn.label}
                    title={btn.label}
                    className={cn(
                      'flex items-center justify-center w-8 h-8 rounded-lg',
                      'transition-colors hover:bg-[var(--color-surface-hover)]',
                    )}
                    style={{ color: 'var(--color-text-secondary)' }}
                    onClick={() => console.log(btn.label)}
                  >
                    {btn.icon}
                  </button>
                ))}
              </div>

              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Start writing your post..."
                className={cn(
                  'w-full min-h-[400px] resize-none bg-transparent border-none outline-none',
                  'text-[16px] leading-relaxed',
                  'placeholder:text-[var(--color-text-muted)]',
                )}
                style={{ color: 'var(--color-text-body)' }}
              />
            </div>
          </div>

          <div
            className="w-px shrink-0"
            style={{ background: 'var(--color-border)' }}
          />

          <div
            className="w-[280px] shrink-0 overflow-y-auto p-4"
            style={{ background: 'var(--color-page)' }}
          >
            <BlogSeoPanel
              title={title}
              seoTitle={seoTitle}
              seoDescription={seoDesc}
              category={category}
              allowComments={allowComments}
              ogImageIsCover={ogIsCover}
              authorName={post?.author_name ?? 'Hamza Iqbal'}
              readingTime={post?.reading_time_minutes ?? null}
              onSeoTitleChange={setSeoTitle}
              onSeoDescChange={setSeoDesc}
              onCategoryChange={setCategory}
              onAllowCommentsChange={setAllowComments}
              onOgImageIsCoverChange={setOgIsCover}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
