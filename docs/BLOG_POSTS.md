# Forgex CRM — Blog Posts Complete Reference

> Complete documentation of how blog posts work in the CRM: schema, fields, create/save/publish, database interaction, permissions, body formats, related tables, APIs, UI flows, and public-site integration.
>
> Companion docs: [`BLOG_COMMENTS.md`](./BLOG_COMMENTS.md) (comment moderation & email), [`AUTH.md`](./AUTH.md) (roles).

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [File inventory](#2-file-inventory)
3. [Database schema](#3-database-schema)
4. [Field-by-field reference (`blog_posts`)](#4-field-by-field-reference-blog_posts)
5. [Status enum & transitions](#5-status-enum--transitions)
6. [Body / editor formats](#6-body--editor-formats)
7. [Permissions](#7-permissions)
8. [End-to-end flows](#8-end-to-end-flows)
9. [BlogEditor — UI state & save payload](#9-blogeditor--ui-state--save-payload)
10. [SEO & publishing panel](#10-seo--publishing-panel)
11. [Cover images (Storage)](#11-cover-images-storage)
12. [Categories & tags](#12-categories--tags)
13. [Slug generation](#13-slug-generation)
14. [Reading time](#14-reading-time)
15. [API routes](#15-api-routes)
16. [Server functions](#16-server-functions)
17. [Client hooks](#17-client-hooks)
18. [Pages & routes](#18-pages--routes)
19. [Preview](#19-preview)
20. [Related tables](#20-related-tables)
21. [RLS policies](#21-rls-policies)
22. [Indexes & FTS](#22-indexes--fts)
23. [Public site (forgex.systems)](#23-public-site-forgexsystems)
24. [Content calendar link](#24-content-calendar-link)
25. [Known gaps & quirks](#25-known-gaps--quirks)

---

## 1. Architecture overview

```
┌─────────────────────────────────────────────────────────────────┐
│  CRM UI                                                          │
│  /blog  →  BlogList / BlogPostRow                                │
│  /blog/new  /blog/[id]  →  BlogEditor + TipTapEditor + SeoPanel  │
│  /blog/[id]/preview  →  Preview renderer                         │
│  /blog/subscribers  →  read-only subscriber table                │
└───────────────┬─────────────────────────────────────────────────┘
                │ React Query hooks (useBlog.ts)
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Next.js API                                                     │
│  GET/POST  /api/blog                                             │
│  GET/PATCH/DELETE  /api/blog/[id]                                │
│  GET/POST  /api/blog/categories                                  │
│  Comments: /api/blog/[id]/comments/...                           │
└───────────────┬─────────────────────────────────────────────────┘
                │ server actions / blog.server.ts
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  Supabase                                                        │
│  blog_posts · blog_categories · blog_comments · blog_subscribers │
│  community_users · storage bucket blog-covers                    │
│  RLS: anon reads published posts; CRM uses authenticated session │
└─────────────────────────────────────────────────────────────────┘
                │ anon key (published only)
                ▼
┌─────────────────────────────────────────────────────────────────┐
│  forgex.systems (separate repo)                                  │
│  Public blog pages, comment submit, subscriber opt-in            │
└─────────────────────────────────────────────────────────────────┘
```

**Responsibility split**

| Concern | Where it lives |
|---------|----------------|
| Draft / review / schedule / publish / SEO | CRM |
| Public rendering of published posts | forgex.systems |
| Comment create (visitors) | forgex.systems → Supabase |
| Comment moderate / reply / emails | CRM |
| Subscriber capture | forgex.systems → `blog_subscribers` |
| Subscriber list | CRM `/blog/subscribers` |

Data is shared in one Supabase project. The CRM does **not** host the public blog UI.

---

## 2. File inventory

### UI components

| Path | Role |
|------|------|
| `src/components/blog/BlogEditor.tsx` | Main create/edit screen: title, body, save, publish, schedule, cover, comments moderation |
| `src/components/blog/BlogEditorHeader.tsx` | Status dropdown, Save Draft, Publish, Preview, saved indicator |
| `src/components/blog/BlogSeoPanel.tsx` | SEO fields, category, tags, comments toggle, featured, OG cover |
| `src/components/blog/BlogList.tsx` | Filtered list of posts |
| `src/components/blog/BlogPostRow.tsx` | Row: edit / preview / delete |
| `src/components/blog/TipTapEditor.tsx` | Re-exports `RichDocEditor` (legacy name) |
| `src/components/docs/RichDocEditor.tsx` | Actual body editor (Markdown textarea) |
| `src/components/blog/index.ts` | Barrel exports |
| `src/components/blog/mock-data.ts` | Legacy mock stubs |

### Pages

| Path | Route |
|------|-------|
| `src/app/(dashboard)/blog/page.tsx` | `/blog` |
| `src/app/(dashboard)/blog/new/page.tsx` | `/blog/new` |
| `src/app/(dashboard)/blog/[id]/page.tsx` | `/blog/[id]` |
| `src/app/(dashboard)/blog/[id]/preview/page.tsx` | `/blog/[id]/preview` |
| `src/app/(dashboard)/blog/subscribers/page.tsx` | `/blog/subscribers` |

### API

| Path | Methods |
|------|---------|
| `src/app/api/blog/route.ts` | `GET`, `POST` |
| `src/app/api/blog/[id]/route.ts` | `GET`, `PATCH`, `DELETE` |
| `src/app/api/blog/categories/route.ts` | `GET`, `POST` |
| `src/app/api/blog/[id]/comments/route.ts` | `GET` |
| `src/app/api/blog/[id]/comments/[commentId]/route.ts` | `PATCH`, `DELETE` |
| `src/app/api/blog/[id]/comments/[commentId]/reply/route.ts` | `POST` |

### Server / hooks / types / constants

| Path | Role |
|------|------|
| `src/server/blog/blog.server.ts` | All blog DB operations |
| `src/hooks/useBlog.ts` | React Query wrappers |
| `src/types/blog.ts` | App types + commenter helpers |
| `src/types/database.types.ts` | Generated Supabase types |
| `src/lib/blog-permissions.ts` | Role checks |
| `src/lib/email/blog-comments.ts` | Approval / reply emails |
| `src/constants/blog-config.ts` | Status badges, filter tabs |
| `src/constants/blog-categories.ts` | Static category name list (secondary) |
| `src/constants/routes.ts` | `ROUTES.BLOG*` and `ROUTES.API.BLOG*` |
| `src/lib/query/keys.ts` | Query keys under `queryKeys.blog` |

### Migrations

| Path | Role |
|------|------|
| `supabase/migrations/00_core/001_extensions_and_enums.sql` | `blog_post_status`, `blog_comment_status` enums |
| `supabase/migrations/05_blog/001_blog.sql` | Categories, posts, comments, community_users, RLS |
| `supabase/migrations/05_blog/002_blog_covers_bucket.sql` | Storage policies for `blog-covers` |
| `supabase/migrations/05_blog/005_create_blog_subscribers.sql` | Subscribers table + RLS |
| `supabase/migrations/05_blog/006_public_site_rls_gaps.sql` | Extra public-site RLS |
| `supabase/migrations/10_indexes/001_indexes.sql` | Blog indexes + FTS |
| `supabase/migrations/06_content/001_content_calendar_docs.sql` | `content_calendar.blog_post_id` FK |

---

## 3. Database schema

### Enums

```sql
blog_post_status    = ('draft', 'in_review', 'scheduled', 'published', 'archived')
blog_comment_status = ('pending', 'approved', 'rejected')
```

### Entity relationship

```
profiles ───────────────◄ blog_posts.author_id
blog_categories ────────◄ blog_posts.category_id
community_users ────────◄ blog_posts.community_author_id   (Phase 2)
blog_posts ─────────────◄ blog_comments.post_id  (ON DELETE CASCADE)
blog_comments ──────────◄ blog_comments.parent_comment_id  (threading)
community_users ────────◄ blog_comments.community_user_id
profiles ───────────────◄ blog_comments.team_user_id
profiles ───────────────◄ blog_comments.reviewed_by
blog_posts ─────────────◄ content_calendar.blog_post_id
blog_subscribers          (no FK; soft-links via source_post_slug text)
```

### Triggers on `blog_posts`

| Trigger | When | Effect |
|---------|------|--------|
| `blog_posts_updated_at` | `BEFORE UPDATE` | Sets `updated_at = now()` via `set_updated_at()` |
| `blog_post_published` | `BEFORE UPDATE` | If status changes **to** `published`, sets `published_at = coalesce(published_at, now())` |

`published_at` is **not** cleared when unpublishing (status change away from `published`).

---

## 4. Field-by-field reference (`blog_posts`)

| Column | Type | Default | Nullable | Set by | Notes |
|--------|------|---------|----------|--------|-------|
| `id` | `uuid` | `gen_random_uuid()` | NO | DB | Primary key |
| `title` | `text` | — | NO | Editor | Falls back to `"Untitled"` if empty on save |
| `slug` | `text` | — | NO | Server on **create** only | Unique; URL key for public site. **Not editable in editor UI** |
| `excerpt` | `text` | — | YES | Editor | Editor copies `seo_description` into `excerpt` on save |
| `body` | `jsonb` | — | YES | Editor | See [§6 Body formats](#6-body--editor-formats) |
| `cover_image_url` | `text` | — | YES | Editor / Storage upload | Public URL from `blog-covers` bucket |
| `author_id` | `uuid` → `profiles` | — | NO | Server on create | Always `session.user.id`; not changed on update |
| `category_id` | `uuid` → `blog_categories` | — | YES | Editor | `ON DELETE SET NULL` |
| `tags` | `text[]` | `'{}'` | NO | Editor | Comma-separated input → array |
| `status` | `blog_post_status` | `'draft'` | NO | Editor / status UI | See [§5](#5-status-enum--transitions) |
| `publish_date` | `timestamptz` | — | YES | Schedule flow | Used when `status = 'scheduled'`; cleared on non-schedule status change |
| `published_at` | `timestamptz` | — | YES | DB trigger | Set once when first becoming `published` |
| `seo_title` | `text` | — | YES | SEO panel | Overrides title in `<title>` on public site |
| `seo_description` | `text` | — | YES | SEO panel | Max ~160 in UI; also written to `excerpt` |
| `canonical_url` | `text` | — | YES | API supports; **editor does not send** | For cross-posting (Medium/DEV) |
| `og_image_url` | `text` | — | YES | Editor | Set to `coverUrl` when “OG Image = Cover” is on; else `null` |
| `reading_time_minutes` | `smallint` | — | YES | Server | Recalculated whenever `body` is written |
| `is_featured` | `boolean` | `false` | NO | SEO panel | Admin-only write on server |
| `allow_comments` | `boolean` | `true` | NO | SEO panel | Public site should respect this |
| `is_community_post` | `boolean` | `false` | NO | Future Phase 2 | Visitor-submitted posts |
| `community_author_id` | `uuid` → `community_users` | — | YES | Future Phase 2 | Set null on community user delete |
| `view_count` | `bigint` | `0` | NO | Public analytics (future) | CRM does not increment |
| `created_at` | `timestamptz` | `now()` | NO | DB | |
| `updated_at` | `timestamptz` | `now()` | NO | Trigger + app | App also sets ISO string on update |

### App-layer enrichments (`BlogPost` type)

Returned by server after join/enrich — **not** DB columns:

| Field | Source |
|-------|--------|
| `author` | `{ full_name, avatar_url }` from `profiles` |
| `category` | `{ id, name, slug }` from `blog_categories` |
| `author_name` | Flattened helper |
| `author_avatar` | Flattened helper |

---

## 5. Status enum & transitions

### Values (UI labels)

| Status | Badge label | Meaning |
|--------|-------------|---------|
| `draft` | Draft | Work in progress; not public |
| `in_review` | In Review | Waiting for review |
| `scheduled` | Scheduled | Will publish at `publish_date` (scheduling job is **not** implemented in CRM — status + date only) |
| `published` | Published | Visible to anon on public site (`status = 'published'`) |
| `archived` | Archived | Hidden from public; kept in CRM |

### How status changes in the CRM

| UI action | Code path | Payload |
|-----------|-----------|---------|
| **Save Draft** | `save('draft')` | Full payload + `status: 'draft'` |
| **Publish** | `save('published')` | Full payload + `status: 'published'` → trigger sets `published_at` |
| **Status dropdown** (not Scheduled) | `handleStatusChange(newStatus)` | `{ status, publish_date: null }` only |
| **Schedule** | Modal → `confirmSchedule` | `{ status: 'scheduled', publish_date }` (requires existing `postId`) |
| **Autosave (30s)** | `save()` with no override | Full payload; **keeps current status** |
| **Publish date field** (when scheduled) | `handlePublishDateChange` | `{ publish_date }` only |

There is **no formal state machine**. Any status can be selected from the dropdown (subject to permissions). There is **no dedicated Unpublish** action — change status to Draft / Archived / etc.

### Member restriction

Members may only create/keep posts as `draft`. Server rejects non-draft status for `role === 'member'`.

---

## 6. Body / editor formats

### Current editor (new format)

`TipTapEditor` is a **name-only alias**. Runtime editor is `RichDocEditor`: Markdown textarea + toolbar. No TipTap `useEditor()` usage in `src/`.

**Saved JSON shape:**

```json
{
  "type": "markdown",
  "body": "# Heading\n\nParagraph with **bold**.\n"
}
```

Helpers in `RichDocEditor.tsx`:

```ts
markdownToDoc(markdown) → { type: 'markdown', body: markdown }
docToMarkdown(content)
  → content.body   if type === 'markdown' && body is string
  → '__LEGACY_TIPTAP__' otherwise
```

If `docToMarkdown` returns `__LEGACY_TIPTAP__`, the editor shows:

> This document was created with the old editor. It is view-only here. Open Preview to read it.

### Legacy TipTap format (old editor)

```json
{
  "type": "doc",
  "content": [
    {
      "type": "paragraph",
      "content": [{ "type": "text", "text": "..." }]
    },
    {
      "type": "heading",
      "attrs": { "level": 2 },
      "content": [{ "type": "text", "text": "Section" }]
    }
  ]
}
```

Legacy posts are editable only via Preview rendering (`renderTipTapNode` in preview page). Existing published posts in Supabase are typically this format.

### Load path in `BlogEditor` (`bodyToEditorContent`)

1. `null` → empty editor  
2. String → try `JSON.parse`; if object use it; else wrap with `markdownToDoc(string)`  
3. Object → use as editor content record  

### Preview render path

| Body shape | Renderer |
|------------|----------|
| `string` | `react-markdown` + `remark-gfm` |
| `{ type: 'markdown', body: string }` | same Markdown renderer |
| TipTap `{ type: 'doc', ... }` | Custom `renderTipTapNode` tree walker |

---

## 7. Permissions

Defined in `src/lib/blog-permissions.ts`.

| Function | Allowed when |
|----------|----------------|
| `canCreatePost` | Any authenticated profile |
| `canEditPost` | `admin` **or** `manager`, **and** `post.author_id === profile.id` |
| `canPublishPost` | `admin` or `manager` (UI helper; Publish button currently gates on `canEdit`) |
| `canDeletePost` | `admin`, **or** (`manager` **and** author) |
| `canFeaturePost` | `admin` only |
| `canModerateComments` | `admin` or `manager` |
| `canManageCategories` | `admin` only |

### Server enforcement (`blog.server.ts`)

| Operation | Server rule |
|-----------|-------------|
| Create | Session required; members → status must be `draft`; `is_featured` forced false unless admin |
| Update | Must be admin/manager **and** author of the post |
| Delete | **Admin only** (stricter than UI `canDeletePost` for managers) |
| Feature | Non-admin cannot set `is_featured: true` |
| Categories create | Admin only |
| Moderate / reply comments | Admin or manager |
| Delete comments | Admin only |

### RLS vs app layer

RLS allows admin/manager to **update any** post. App server additionally requires **authorship**. Prefer treating the **server function** as source of truth for CRM API calls.

Subscribers page: server-side redirect unless `admin` or `manager`.

---

## 8. End-to-end flows

### 8.1 Create new post

```
User → /blog/new
  → BlogEditor (isNew, no postId)
  → edits title / body / SEO / cover
  → Save Draft or Publish
       → buildPayload(status)
       → POST /api/blog  (Zod createSchema)
       → createBlogPost()
            · slugify(title)
            · unique slug check
            · insert row (author_id = session user)
            · reading_time_minutes
       → setPostId(created.id)
       → router.replace(/blog/{id})
       → toast
```

### 8.2 Update existing post (manual save)

```
User → /blog/[id]
  → useBlogPost(id) → GET /api/blog/[id]
  → hydrate editor state
  → Save Draft / Publish / autosave
       → PATCH /api/blog/[id]
       → updateBlogPost(id, payload)
            · permission check
            · optional reading_time recalc
            · update + enrich
```

### 8.3 Publish

```
Publish button → save('published')
  → full payload with status: 'published'
  → create or update
  → DB trigger set_blog_published_at (if transitioning into published)
  → Public site can SELECT via anon policy status = 'published'
```

### 8.4 Schedule

```
Status → Scheduled
  → modal asks for date
  → confirmSchedule
  → PATCH { status: 'scheduled', publish_date }
  · Requires post already saved (has postId)
  · No cron/job in CRM flips scheduled → published automatically
```

### 8.5 Status change (non-schedule)

```
Dropdown → draft | in_review | published | archived
  → PATCH { status, publish_date: null }
  · Does not rewrite title/body/SEO in that request
```

### 8.6 Autosave

```
Every 30 seconds IF:
  · postId exists
  · canEdit
  · dirtyRef === true
  · not currently saving
THEN save() with current status (no override)
```

Dirty tracking: any change to title, body, status, seo, category, tags, allowComments, isFeatured, coverUrl, publishDate sets `dirtyRef` (after initial hydrate ignore pass).

### 8.7 Delete

```
BlogPostRow menu → Delete (if canDeletePost)
  → DELETE /api/blog/[id]
  → deleteBlogPost()  // admin only on server
  → CASCADE deletes blog_comments
```

### 8.8 Cover upload

```
File pick → supabase.storage.from('blog-covers')
  path: `{postId|new}/{timestamp}-{filename}`
  → getPublicUrl → setCoverUrl local state
  → persisted on next save via cover_image_url / og_image_url
```

---

## 9. BlogEditor — UI state & save payload

### Local state fields

| State | Maps to DB / behavior |
|-------|------------------------|
| `postId` | `blog_posts.id` |
| `title` | `title` |
| `body` | `body` (JSON record) |
| `status` | `status` |
| `publishDate` | `publish_date` (date portion `YYYY-MM-DD`) |
| `seoTitle` | `seo_title` |
| `seoDesc` | `seo_description` **and** `excerpt` |
| `categoryId` | `category_id` |
| `tags` / `tagsInput` | `tags` |
| `allowComments` | `allow_comments` |
| `ogIsCover` | controls whether `og_image_url = coverUrl` |
| `isFeatured` | `is_featured` |
| `coverUrl` | `cover_image_url` |
| `lastSavedAt` | UI “Saved …” indicator |
| Comment reply UI | separate; does not affect post payload |

### Exact save payload (`buildPayload`)

```ts
{
  title: title.trim() || 'Untitled',
  excerpt: seoDesc || null,
  body: body ?? null,
  cover_image_url: coverUrl,
  category_id: categoryId || null,
  tags,
  status: nextStatus,                 // override or current
  seo_title: seoTitle || null,
  seo_description: seoDesc || null,
  og_image_url: ogIsCover ? coverUrl : null,
  is_featured: isFeatured,
  allow_comments: allowComments,
  publish_date:
    nextStatus === 'scheduled' && publishDate ? publishDate : null,
}
```

### Fields **not** sent by the editor

| Field | Notes |
|-------|-------|
| `slug` | Set only on create in `createBlogPost` |
| `canonical_url` | Supported by API schema; no UI |
| `author_id` | Server-assigned |
| `published_at` | Trigger-managed |
| `view_count` | Public analytics |
| `is_community_post` / `community_author_id` | Phase 2 |
| `reading_time_minutes` | Server-calculated |

---

## 10. SEO & publishing panel

`BlogSeoPanel` sections:

### SEO

| Control | Limit | DB field |
|---------|-------|----------|
| SEO Title | 60 chars (UI) | `seo_title` |
| Meta Description | 160 chars (UI) | `seo_description` (+ copied to `excerpt`) |
| Google preview | Display only | Uses `slugify(seoTitle \|\| title)` for path preview — **not** the real stored slug |

Preview path shown: `forgex.systems › blog › {slugified title}`

### Publishing

| Control | DB / behavior |
|---------|----------------|
| Category select / create | `category_id`; admin can create via API |
| Tags | `tags[]` |
| Publish date | Shown when scheduled; updates `publish_date` |
| Allow Comments | `allow_comments` |
| OG Image = Cover | When on → `og_image_url = cover_image_url` on save |
| Featured | `is_featured` (admin UI only via `canFeaturePost`) |

### Author (read-only)

Author display name + `reading_time_minutes` from loaded post.

---

## 11. Cover images (Storage)

| Item | Value |
|------|-------|
| Bucket | `blog-covers` (create in Supabase dashboard; policies in `002_blog_covers_bucket.sql`) |
| Path pattern | `{postId \| 'new'}/{timestamp}-{sanitized-filename}` |
| Client | Browser Supabase client (`createClient()` from `@/lib/supabase/client`) |
| Policies | authenticated INSERT / SELECT / DELETE on that bucket |
| Persistence | URL stored in `cover_image_url`; optionally mirrored to `og_image_url` |

---

## 12. Categories & tags

### `blog_categories`

| Column | Type |
|--------|------|
| `id` | uuid PK |
| `name` | text |
| `slug` | text unique |
| `description` | text |
| `created_at` | timestamptz |

**Seeded** in `001_blog.sql`:

- AI & Automation (`ai-automation`)
- SaaS Development (`saas-dev`)
- CRM & Sales (`crm-sales`)
- Case Studies (`case-studies`)
- Engineering (`engineering`)
- Business (`business`)

**API:** `GET/POST /api/blog/categories`  
**Create:** admin only; slug = `slugify(name)`

Static lists in `blog-config.ts` / `blog-categories.ts` are secondary; live UI uses DB categories.

### Tags

Stored as `blog_posts.tags text[]`. UI: comma-separated string → split/trim into array on change. Indexed with GIN.

---

## 13. Slug generation

In `createBlogPost`:

```ts
slugify(str) =
  lower → trim → spaces to '-' → strip non [a-z0-9-] → collapse '--' → slice(0, 80)

slug = slugify(input.slug || title) || `post-${Date.now()}`
if slug already exists → `${slug}-${Date.now().toString(36)}`
```

Update path does **not** auto-change slug when title changes (explicit comment in server). There is no slug edit UI.

Public URL convention (external): `https://www.forgex.systems/blog/{slug}`

---

## 14. Reading time

```ts
estimateReadingTime(body):
  if body not object → 1
  text = JSON.stringify(body)
  words = text.split(/\s+/).length
  return max(1, round(words / 200))
```

Called on **create** always, and on **update** when `body` is present in the payload. Stored in `reading_time_minutes`.

Note: for Markdown bodies this counts JSON wrapper tokens too (approximate).

---

## 15. API routes

### Posts

| Method | Path | Body / query | Handler |
|--------|------|--------------|---------|
| `GET` | `/api/blog` | `?search&status&category_id&author_id` | `getBlogPosts` |
| `POST` | `/api/blog` | Create schema (Zod) | `createBlogPost` |
| `GET` | `/api/blog/[id]` | UUID | `getBlogPost` |
| `PATCH` | `/api/blog/[id]` | Update schema (strict) | `updateBlogPost` |
| `DELETE` | `/api/blog/[id]` | UUID | `deleteBlogPost` |

### Create/update Zod fields

`title`, `slug`, `excerpt`, `body` (object), `cover_image_url`, `category_id` (uuid), `tags`, `status` (enum), `publish_date`, `seo_title`, `seo_description`, `canonical_url`, `og_image_url`, `is_featured`, `allow_comments`.

Update schema is **`.strict()`** — unknown keys rejected.

### Categories

| Method | Path | Handler |
|--------|------|---------|
| `GET` | `/api/blog/categories` | `getBlogCategories` |
| `POST` | `/api/blog/categories` | `createBlogCategory` |

### Comments (see also `BLOG_COMMENTS.md`)

| Method | Path | Handler |
|--------|------|---------|
| `GET` | `/api/blog/[id]/comments` | `getBlogComments` |
| `PATCH` | `/api/blog/[id]/comments/[commentId]` | `moderateBlogComment` |
| `DELETE` | `/api/blog/[id]/comments/[commentId]` | `deleteBlogComment` |
| `POST` | `/api/blog/[id]/comments/[commentId]/reply` | `replyToBlogComment` |

### Subscribers

**No** `/api/blog/subscribers` route. Page queries Supabase directly with the server client.

---

## 16. Server functions

File: `src/server/blog/blog.server.ts`

| Function | Purpose |
|----------|---------|
| `getBlogPosts(filters?)` | List posts; filter by status/category/author/search; join category; enrich author |
| `getBlogPost(id)` | Single post + category + author |
| `createBlogPost(input)` | Insert; slug uniqueness; reading time; featured admin-only; member draft-only |
| `updateBlogPost(id, input)` | Author+admin/manager edit; reading time if body; featured guard |
| `deleteBlogPost(id)` | Admin-only hard delete |
| `getBlogCategories()` | Ordered by name |
| `createBlogCategory({ name, description? })` | Admin; slugify |
| `getBlogComments(postId)` | All comments for moderation UI + author enrichment |
| `moderateBlogComment(id, status, reason?)` | Approve/reject; may send approval email |
| `replyToBlogComment({ postId, parentCommentId, content })` | Team reply (`is_team_reply`); may send reply email |
| `deleteBlogComment(id)` | Admin-only |

**Internal helpers:** `slugify`, `estimateReadingTime`, `fetchProfiles`, `enrichPost`, `normalizeCommentRow`.

All post mutations use the **user-scoped** Supabase server client (RLS applies), except email cooldown / mark-sent which use the **service** client.

---

## 17. Client hooks

File: `src/hooks/useBlog.ts`

| Hook | HTTP | Invalidates |
|------|------|-------------|
| `useBlogPosts(filters?)` | `GET /api/blog?...` | — |
| `useBlogPost(id)` | `GET /api/blog/[id]` | — |
| `useCreateBlogPost` | `POST /api/blog` | `blog` all |
| `useUpdateBlogPost` | `PATCH /api/blog/[id]` | list + detail |
| `useDeleteBlogPost` | `DELETE /api/blog/[id]` | list |
| `useBlogCategories` | `GET /api/blog/categories` | — |
| `useCreateBlogCategory` | `POST .../categories` | categories |
| `useBlogComments(postId)` | `GET .../comments` | — |
| `useModerateComment` | `PATCH .../comments/[id]` | comments |
| `useDeleteBlogComment` | `DELETE .../comments/[id]` | comments |
| `useReplyToBlogComment` | `POST .../reply` | comments |

Query keys (`src/lib/query/keys.ts`):

```ts
queryKeys.blog.all
queryKeys.blog.list(filters)
queryKeys.blog.detail(id)
queryKeys.blog.comments(id)
queryKeys.blog.categories
```

---

## 18. Pages & routes

### App routes (`ROUTES`)

```ts
BLOG:             '/blog'
BLOG_POST:        (id) => `/blog/${id}`
BLOG_NEW:         '/blog/new'
BLOG_SUBSCRIBERS: '/blog/subscribers'
API.BLOG:         '/api/blog'
API.BLOG_POST:    (id) => `/api/blog/${id}`
```

Preview path `/blog/[id]/preview` is **hard-coded** in UI (not in `ROUTES`).

### Page behavior

| Page | Behavior |
|------|----------|
| `/blog` | Search (debounced 300ms), status tabs, counts, New Post, list rows |
| `/blog/new` | `BlogEditor` with `isNew` |
| `/blog/[id]` | `BlogEditor` with `postId` |
| `/blog/[id]/preview` | Read-only article chrome + body renderer |
| `/blog/subscribers` | Admin/manager; table of `blog_subscribers` |

Nav: Blog + Subscribers links in `src/constants/nav.ts`.

---

## 19. Preview

File: `src/app/(dashboard)/blog/[id]/preview/page.tsx`

- Loads post via `useBlogPost`
- Shows title, status badge, author, dates, cover, body
- Body rendering rules: see [§6](#6-body--editor-formats)
- Opened from editor header and list row menu (`window.open`)

Legacy TipTap nodes supported in the walker include (among others): `doc`, `paragraph`, `heading`, `text` (+ marks: bold/italic/underline/strike/code/link), lists, blockquote, codeBlock, hardBreak, horizontalRule, image, table nodes — as implemented in that file.

---

## 20. Related tables

### `blog_comments` (moderation in BlogEditor)

Core columns from migration + live types:

| Column | Notes |
|--------|-------|
| `id`, `post_id`, `content` | Required |
| `community_user_id` XOR `team_user_id` | Exactly one author |
| `parent_comment_id` | Threading |
| `status` | `pending` \| `approved` \| `rejected` |
| `reviewed_by`, `reviewed_at`, `rejection_reason` | Moderation |
| `is_team_reply` | Team replies (types/live DB; used by reply flow) |
| `author_name`, `author_email` | Fallbacks for identity / email |
| `notification_sent_at` | Email cooldown tracking |

Full comment flow is documented in [`BLOG_COMMENTS.md`](./BLOG_COMMENTS.md).

### `blog_subscribers`

| Column | Notes |
|--------|-------|
| `email` | Unique |
| `source_post_slug` | Soft link to post slug (no FK) |
| `subscribed_at` | Default now |
| `status` | `active` \| `unsubscribed` |

Inserted by public site (anon INSERT). CRM lists at `/blog/subscribers`.

### `community_users`

Visitor identities for comments / future community posts. Linked from `blog_posts.community_author_id` and `blog_comments.community_user_id`.

### `content_calendar`

Optional `blog_post_id` FK — calendar events can point at a post (see calendar server).

---

## 21. RLS policies

### `blog_posts`

| Policy | Role | Rule |
|--------|------|------|
| `public_read_published_posts` | `anon` | `status = 'published'` |
| `team_read_all_posts` | `authenticated` | Has `profiles` row |
| `admin_manager_insert_posts` | `authenticated` | role in admin/manager |
| `member_insert_draft_posts` | `authenticated` | member + draft + author_id = auth.uid() |
| `admin_manager_update_posts` | `authenticated` | admin/manager (any post) |
| `author_update_own_draft` | `authenticated` | author + status draft |
| `admin_delete_posts` | `authenticated` | admin |

### `blog_categories`

Public + team SELECT; admin ALL.

### `blog_comments` (summary)

Anon: approved only. Team: read all; insert as `team_user_id = auth.uid()`; admin/manager update. Additional public insert policies may exist in `006_public_site_rls_gaps.sql`.

### `blog_subscribers`

Anon INSERT; authenticated SELECT + UPDATE.

---

## 22. Indexes & FTS

From `10_indexes/001_indexes.sql`:

| Index | Purpose |
|-------|---------|
| `blog_posts_slug_idx` | Unique slug lookups |
| `blog_posts_status_idx` | `(status, publish_date desc)` |
| `blog_posts_author_idx` | Author filter |
| `blog_posts_category_idx` | Category (partial) |
| `blog_posts_tags_gin_idx` | Tag search |
| `blog_posts_featured_idx` | Featured posts |
| `blog_posts_fts_idx` | GIN on `blog_posts_fts_vector(title, excerpt, tags)` |
| `blog_comments_post_idx` | Comments by post/status |
| `blog_comments_parent_idx` | Threading |
| `blog_comments_pending_idx` | Moderation queue |

CRM list search currently uses `ilike` on `title`/`excerpt`, not the FTS function (FTS available for public site / future use).

---

## 23. Public site (forgex.systems)

| Capability | Mechanism |
|------------|-----------|
| Read posts | Anon SELECT where `status = 'published'` |
| Read categories | Anon SELECT all |
| Read comments | Anon SELECT where `status = 'approved'` |
| Submit comments | Public site insert (RLS); CRM moderates |
| Subscribe | Anon INSERT into `blog_subscribers` |
| Comment emails CTA | `https://www.forgex.systems/blog/{slug}` |

CRM never renders the public marketing blog. Shared DB only.

---

## 24. Content calendar link

`content_calendar.blog_post_id` → `blog_posts.id`. Calendar APIs accept optional `blog_post_id`. Creating calendar items from posts is handled in `src/server/calendar/calendar.server.ts` (separate feature; posts remain the source of blog content).

---

## 25. Known gaps & quirks

1. **Editor name vs reality** — `TipTapEditor` is Markdown/`RichDocEditor`; `@tiptap/*` packages are unused at runtime.
2. **Legacy bodies** — Existing posts with `type: "doc"` are view-only in the editor; Preview still works.
3. **No scheduled→published job** — Setting `scheduled` + `publish_date` does not auto-publish.
4. **Slug immutable in UI** — Created once; title changes do not update slug.
5. **`canonical_url`** — In API/DB, no editor field.
6. **`excerpt` duplication** — Always mirrored from `seo_description` on editor save.
7. **Delete permission mismatch** — UI allows manager-author delete; server allows admin only.
8. **`canPublishPost` unused by Publish button** — Publish uses `canEdit` path (admin/manager author).
9. **Comment columns vs migration** — `is_team_reply`, `author_name`, `author_email`, `notification_sent_at` exist in `database.types.ts` / live DB and reply/email code; not in original `001_blog.sql` (applied outside or later).
10. **`view_count`** — Column exists; CRM does not update it.
11. **Community posts** — `is_community_post` / `community_author_id` reserved for Phase 2; unused in editor.
12. **Reading time** — Approximate via `JSON.stringify` word count.
13. **OG toggle** — `ogIsCover` defaults `true` and is not hydrated from DB (`og_image_url` comparison); local UI assumption.
14. **Autosave toast** — Autosave calls `save()` which toasts “Draft saved” even when status is not draft.

---

## Quick checklist: what gets written on each action

| Action | Columns written |
|--------|-----------------|
| Create (Save Draft / Publish) | `title`, `slug`, `excerpt`, `body`, `cover_image_url`, `author_id`, `category_id`, `tags`, `status`, `publish_date`, `seo_*`, `canonical_url` (if sent), `og_image_url`, `reading_time_minutes`, `is_featured`, `allow_comments`, timestamps |
| Update (full save) | Same as create except `slug`/`author_id` not in payload; `updated_at`; `reading_time_minutes` if body present; trigger may set `published_at` |
| Status-only change | `status`, `publish_date: null`, `updated_at` |
| Schedule confirm | `status: scheduled`, `publish_date`, `updated_at` |
| Publish date field | `publish_date`, `updated_at` |
| Cover upload alone | Storage only until next save |
| Delete | Entire row (+ cascaded comments) |

---

*Generated from the Forgex CRM codebase. When behavior changes, update this file alongside `BLOG_COMMENTS.md`.*
