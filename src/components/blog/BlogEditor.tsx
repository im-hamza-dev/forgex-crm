'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Sidebar } from '@/components/layout'
import { Avatar, Button, toast } from '@/components/ui'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from '@/hooks/useAuth'
import {
  useBlogPost,
  useCreateBlogPost,
  useUpdateBlogPost,
  useBlogComments,
  useModerateComment,
  useDeleteBlogComment,
} from '@/hooks/useBlog'
import {
  canModerateComments,
  canDeletePost,
  canEditPost,
} from '@/lib/blog-permissions'
import { ROUTES } from '@/constants/routes'
import { BlogEditorHeader } from './BlogEditorHeader'
import { BlogSeoPanel } from './BlogSeoPanel'
import { TipTapEditor } from './TipTapEditor'
import type { BlogPost, BlogPostStatus } from '@/types/blog'
import type { Json } from '@/types/database.types'

interface BlogEditorProps {
  post?: BlogPost | null
  postId?: string
  isNew?: boolean
}

function isTipTapDoc(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    (value as { type?: string }).type === 'doc'
  )
}

function bodyToEditorContent(
  body: BlogPost['body'],
): Record<string, unknown> | null {
  if (!body) return null
  if (typeof body === 'string') {
    try {
      const parsed: unknown = JSON.parse(body)
      return isTipTapDoc(parsed) ? parsed : null
    } catch {
      return {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: body }],
          },
        ],
      }
    }
  }
  if (isTipTapDoc(body)) return body as Record<string, unknown>
  return null
}

export function BlogEditor({
  post,
  postId: postIdProp,
  isNew = false,
}: BlogEditorProps) {
  const router = useRouter()
  const { profile, signOut } = useAuth()
  const { data: fetchedPost, isLoading: postLoading } = useBlogPost(
    postIdProp ?? null,
  )
  const resolvedPost = post ?? fetchedPost ?? null
  const canEdit =
    !resolvedPost ||
    canEditPost(profile, { author_id: resolvedPost.author_id ?? '' })
  const [collapsed, setCollapsed] = useState(true)
  const [postId, setPostId] = useState<string | null>(
    post?.id ?? postIdProp ?? null,
  )
  const [title, setTitle] = useState(resolvedPost?.title ?? '')
  const [body, setBody] = useState<Record<string, unknown> | null>(
    bodyToEditorContent(resolvedPost?.body ?? null),
  )
  const [status, setStatus] = useState<BlogPostStatus>(
    resolvedPost?.status ?? 'draft',
  )
  const [seoTitle, setSeoTitle] = useState(resolvedPost?.seo_title ?? '')
  const [seoDesc, setSeoDesc] = useState(resolvedPost?.seo_description ?? '')
  const [categoryId, setCategoryId] = useState(resolvedPost?.category_id ?? '')
  const [tags, setTags] = useState<string[]>(resolvedPost?.tags ?? [])
  const [tagsInput, setTagsInput] = useState(
    (resolvedPost?.tags ?? []).join(', '),
  )
  const [allowComments, setAllowComments] = useState(
    resolvedPost?.allow_comments ?? true,
  )
  const [ogIsCover, setOgIsCover] = useState(true)
  const [isFeatured, setIsFeatured] = useState(
    resolvedPost?.is_featured ?? false,
  )
  const [coverUrl, setCoverUrl] = useState(
    resolvedPost?.cover_image_url ?? null,
  )
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(
    resolvedPost?.updated_at ? new Date(resolvedPost.updated_at) : null,
  )
  const [uploadingCover, setUploadingCover] = useState(false)
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
  const dirtyRef = useRef(false)
  const ignoreDirtyRef = useRef(true)
  const [hydrated, setHydrated] = useState(() => !postIdProp || Boolean(post))

  const createPost = useCreateBlogPost()
  const updatePost = useUpdateBlogPost()
  const { data: comments = [] } = useBlogComments(postId)
  const moderate = useModerateComment()
  const deleteComment = useDeleteBlogComment()

  const isSaving = createPost.isPending || updatePost.isPending

  useEffect(() => {
    if (titleRef.current) {
      titleRef.current.style.height = 'auto'
      titleRef.current.style.height = `${titleRef.current.scrollHeight}px`
    }
  }, [title])

  useEffect(() => {
    if (ignoreDirtyRef.current) {
      ignoreDirtyRef.current = false
      dirtyRef.current = false
      return
    }
    dirtyRef.current = true
  }, [
    title,
    body,
    status,
    seoTitle,
    seoDesc,
    categoryId,
    tags,
    allowComments,
    isFeatured,
    coverUrl,
  ])

  useEffect(() => {
    if (!resolvedPost) return
    if (postIdProp && !post) {
      ignoreDirtyRef.current = true
      setTitle(resolvedPost.title ?? '')
      setBody(bodyToEditorContent(resolvedPost.body ?? null))
      setStatus(resolvedPost.status ?? 'draft')
      setSeoTitle(resolvedPost.seo_title ?? '')
      setSeoDesc(resolvedPost.seo_description ?? '')
      setCategoryId(resolvedPost.category_id ?? '')
      setTags(resolvedPost.tags ?? [])
      setTagsInput((resolvedPost.tags ?? []).join(', '))
      setAllowComments(resolvedPost.allow_comments ?? true)
      setIsFeatured(resolvedPost.is_featured ?? false)
      setCoverUrl(resolvedPost.cover_image_url ?? null)
      setLastSavedAt(
        resolvedPost.updated_at ? new Date(resolvedPost.updated_at) : null,
      )
      setPostId(resolvedPost.id)
      dirtyRef.current = false
      setHydrated(true)
    }
  }, [resolvedPost, postIdProp, post])

  const buildPayload = useCallback(
    (overrideStatus?: BlogPostStatus) => {
      const nextStatus = overrideStatus ?? status
      return {
        title: title.trim() || 'Untitled',
        excerpt: seoDesc || null,
        body: (body as Json) ?? null,
        cover_image_url: coverUrl,
        category_id: categoryId || null,
        tags,
        status: nextStatus,
        seo_title: seoTitle || null,
        seo_description: seoDesc || null,
        og_image_url: ogIsCover ? coverUrl : null,
        is_featured: isFeatured,
        allow_comments: allowComments,
      }
    },
    [
      title,
      body,
      coverUrl,
      categoryId,
      tags,
      status,
      seoTitle,
      seoDesc,
      ogIsCover,
      isFeatured,
      allowComments,
    ],
  )

  const save = useCallback(
    async (overrideStatus?: BlogPostStatus) => {
      try {
        const payload = buildPayload(overrideStatus)
        if (postId) {
          await updatePost.mutateAsync({ id: postId, data: payload })
        } else {
          const created = await createPost.mutateAsync(payload)
          setPostId(created.id)
          if (isNew) {
            router.replace(ROUTES.BLOG_POST(created.id))
          }
        }
        if (overrideStatus) setStatus(overrideStatus)
        setLastSavedAt(new Date())
        dirtyRef.current = false
        toast.success(
          overrideStatus === 'published' ? 'Published' : 'Draft saved',
        )
      } catch (err) {
        toast.error(err instanceof Error ? err.message : 'Save failed')
      }
    },
    [buildPayload, postId, updatePost, createPost, isNew, router],
  )

  // Auto-save every 30s when post exists
  useEffect(() => {
    if (!postId || !canEdit) return
    const id = window.setInterval(() => {
      if (dirtyRef.current && !isSaving) {
        void save()
      }
    }, 30_000)
    return () => window.clearInterval(id)
  }, [postId, save, isSaving, canEdit])

  const handleCoverUpload = async (file: File) => {
    setUploadingCover(true)
    try {
      const supabase = createClient()
      const folder = postId ?? 'new'
      const path = `${folder}/${Date.now()}-${file.name.replace(/\s+/g, '-')}`
      const { error } = await supabase.storage
        .from('blog-covers')
        .upload(path, file, { upsert: true })
      if (error) throw error
      const { data } = supabase.storage.from('blog-covers').getPublicUrl(path)
      setCoverUrl(data.publicUrl)
      toast.success('Cover uploaded')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  const authorName =
    resolvedPost?.author?.full_name ??
    resolvedPost?.author_name ??
    profile?.full_name ??
    'You'

  const showSpinner =
    Boolean(postIdProp) && (!hydrated || (postLoading && !resolvedPost))

  return (
    <div className="min-h-screen" style={{ background: 'var(--color-page)' }}>
      <Sidebar
        collapsed={collapsed}
        onCollapsedChange={setCollapsed}
        userName={profile?.full_name ?? 'User'}
        userRole={profile?.role ?? 'member'}
        userAvatarUrl={profile?.avatar_url ?? null}
        notificationCount={0}
        onSignOut={() => void signOut().then(() => router.push(ROUTES.LOGIN))}
      />

      {showSpinner ? (
        <div
          className={cn(
            'min-h-screen flex items-center justify-center',
            collapsed ? 'pl-[56px]' : 'pl-[240px]',
          )}
        >
          <div className="w-8 h-8 rounded-full border-2 border-[var(--color-accent)] border-t-transparent animate-spin" />
        </div>
      ) : null}

      {showSpinner ? null : (

      <div
        className={cn(
          'flex flex-col h-screen',
          'transition-[padding] duration-200 ease-in-out',
          collapsed ? 'pl-[56px]' : 'pl-[240px]',
        )}
      >
        <BlogEditorHeader
          postId={postId ?? null}
          status={status}
          canEdit={canEdit}
          onStatusChange={canEdit ? setStatus : () => {}}
          onSaveDraft={canEdit ? () => void save('draft') : () => {}}
          onPublish={canEdit ? () => void save('published') : () => {}}
          isSaving={isSaving}
          lastSavedAt={lastSavedAt}
        />

        {!canEdit && (
          <div
            className="flex items-center gap-2 px-6 py-2 text-[12px]"
            style={{
              background: 'var(--color-warning-bg)',
              color: 'var(--color-warning)',
              borderBottom: '1px solid var(--color-border)',
            }}
          >
            <span>👁</span>
            <span>
              You are viewing this post in read-only mode.
              Only the author can edit it.
            </span>
          </div>
        )}

        <div
          className="flex flex-1 overflow-hidden"
          style={{ background: 'var(--color-page)' }}
        >
          <div
            className="flex-1 overflow-y-auto"
            style={{ background: 'var(--color-surface)' }}
          >
            <div className="max-w-[720px] mx-auto px-10 pt-10 pb-20">
              {canEdit ? (
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
              ) : (
                <h1
                  className="text-[28px] font-bold leading-tight mb-6"
                  style={{ color: 'var(--color-text-heading)' }}
                >
                  {title || 'Untitled'}
                </h1>
              )}

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) void handleCoverUpload(file)
                }}
              />

              {coverUrl ? (
                <div className="relative mb-6 rounded-xl overflow-hidden border border-[var(--color-border)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={coverUrl}
                    alt="Cover"
                    className="w-full h-[200px] object-cover"
                  />
                  {canEdit && (
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      disabled={uploadingCover}
                      className="absolute bottom-3 right-3 h-[32px] px-3 rounded-lg text-[12px] font-medium bg-[var(--color-surface)] border border-[var(--color-border)]"
                    >
                      Change cover
                    </button>
                  )}
                </div>
              ) : canEdit ? (
                <div
                  role="button"
                  tabIndex={0}
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
                  onClick={() => fileRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === 'Enter' && fileRef.current?.click()
                  }
                >
                  <p
                    className="text-[14px]"
                    style={{ color: 'var(--color-text-muted)' }}
                  >
                    {uploadingCover ? 'Uploading...' : 'Upload cover image'}
                  </p>
                </div>
              ) : null}

              <TipTapEditor
                content={body}
                onChange={setBody}
                placeholder="Start writing your post..."
                editable={canEdit}
              />

              {postId && (
                <div className="mt-12 pt-8 border-t border-[var(--color-border)]">
                  <h3
                    className="text-[16px] font-bold mb-4"
                    style={{ color: 'var(--color-text-heading)' }}
                  >
                    Comments ({comments.length})
                  </h3>
                  <div className="space-y-3">
                    {comments.map((c) => (
                      <div
                        key={c.id}
                        className="rounded-xl border p-4"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <div className="flex items-start gap-3">
                          <Avatar
                            name={c.author?.full_name ?? 'User'}
                            src={c.author?.avatar_url}
                            size="sm"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[13px] font-semibold text-[var(--color-text-heading)]">
                                {c.author?.full_name ?? 'User'}
                              </span>
                              <span
                                className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                                style={{
                                  background:
                                    c.status === 'approved'
                                      ? 'var(--color-success-bg)'
                                      : c.status === 'rejected'
                                        ? 'var(--color-danger-bg)'
                                        : 'var(--color-warning-bg)',
                                  color:
                                    c.status === 'approved'
                                      ? 'var(--color-success)'
                                      : c.status === 'rejected'
                                        ? 'var(--color-danger)'
                                        : 'var(--color-warning)',
                                }}
                              >
                                {c.status}
                              </span>
                            </div>
                            <p className="text-[13px] text-[var(--color-text-body)] whitespace-pre-wrap">
                              {c.content}
                            </p>
                            {canModerateComments(profile) &&
                              c.status === 'pending' && (
                                <div className="flex gap-2 mt-3">
                                  <Button
                                    size="sm"
                                    variant="primary"
                                    loading={moderate.isPending}
                                    onClick={() =>
                                      void moderate
                                        .mutateAsync({
                                          postId,
                                          commentId: c.id,
                                          status: 'approved',
                                        })
                                        .then(() =>
                                          toast.success('Approved'),
                                        )
                                        .catch((err: unknown) =>
                                          toast.error(
                                            err instanceof Error
                                              ? err.message
                                              : 'Failed',
                                          ),
                                        )
                                    }
                                  >
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    loading={moderate.isPending}
                                    onClick={() =>
                                      void moderate
                                        .mutateAsync({
                                          postId,
                                          commentId: c.id,
                                          status: 'rejected',
                                        })
                                        .then(() =>
                                          toast.success('Rejected'),
                                        )
                                        .catch((err: unknown) =>
                                          toast.error(
                                            err instanceof Error
                                              ? err.message
                                              : 'Failed',
                                          ),
                                        )
                                    }
                                  >
                                    Reject
                                  </Button>
                                </div>
                              )}
                            {profile?.role === 'admin' && (
                              <button
                                type="button"
                                className="mt-2 text-[12px] text-[var(--color-danger)]"
                                onClick={() =>
                                  void deleteComment
                                    .mutateAsync({
                                      postId,
                                      commentId: c.id,
                                    })
                                    .then(() => toast.success('Deleted'))
                                    .catch((err: unknown) =>
                                      toast.error(
                                        err instanceof Error
                                          ? err.message
                                          : 'Failed',
                                      ),
                                    )
                                }
                              >
                                Delete
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {comments.length === 0 && (
                      <p className="text-[13px] text-[var(--color-text-muted)]">
                        No comments yet
                      </p>
                    )}
                  </div>
                </div>
              )}

              {resolvedPost && canDeletePost(profile, resolvedPost) && (
                <p className="mt-8 text-[12px] text-[var(--color-text-muted)]">
                  Admin delete is available from the blog list.
                </p>
              )}
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
            <div
              className={cn(!canEdit && 'pointer-events-none opacity-70')}
              aria-disabled={!canEdit}
            >
              <BlogSeoPanel
                title={title}
                seoTitle={seoTitle}
                seoDescription={seoDesc}
                categoryId={categoryId}
                tags={tags}
                tagsInput={tagsInput}
                allowComments={allowComments}
                ogImageIsCover={ogIsCover}
                isFeatured={isFeatured}
                authorName={authorName}
                readingTime={resolvedPost?.reading_time_minutes ?? null}
                onSeoTitleChange={setSeoTitle}
                onSeoDescChange={setSeoDesc}
                onCategoryChange={setCategoryId}
                onTagsInputChange={setTagsInput}
                onTagsChange={setTags}
                onAllowCommentsChange={setAllowComments}
                onOgImageIsCoverChange={setOgIsCover}
                onIsFeaturedChange={setIsFeatured}
              />
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  )
}
