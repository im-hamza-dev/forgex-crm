# Blog Post Creation Guide — CRM to Public Site

> Everything you need to know before creating a blog post: what every field does, how the body is stored, what the public site reads, and how the rendered page looks.
>
> **Audit-only** — describes the architecture as it exists today.

---

## Table of contents

1. [Architecture overview](#1-architecture-overview)
2. [Database schema — every column](#2-database-schema--every-column)
3. [CRM editor — what you fill in](#3-crm-editor--what-you-fill-in)
4. [Body format — how content is stored](#4-body-format--how-content-is-stored)
5. [Save payload — what goes to the API](#5-save-payload--what-goes-to-the-api)
6. [Create flow — server + OG generation](#6-create-flow--server--og-generation)
7. [Update flow — what happens on save/autosave](#7-update-flow--what-happens-on-saveautosave)
8. [Cover image upload](#8-cover-image-upload)
9. [OG image generation](#9-og-image-generation)
10. [SEO panel fields](#10-seo-panel-fields)
11. [TL;DR](#11-tldr)
12. [FAQs](#12-faqs)
13. [Categories & tags](#13-categories--tags)
14. [Status & publishing](#14-status--publishing)
15. [Public site — how it fetches posts](#15-public-site--how-it-fetches-posts)
16. [Public site — how it renders the body](#16-public-site--how-it-renders-the-body)
17. [Public site — page layout & metadata](#17-public-site--page-layout--metadata)
18. [Public site — comments & subscriber capture](#18-public-site--comments--subscriber-capture)
19. [Column cross-reference — CRM writes vs public reads](#19-column-cross-reference--crm-writes-vs-public-reads)
20. [Rendering differences — CRM preview vs public site](#20-rendering-differences--crm-preview-vs-public-site)
21. [Checklist — creating a complete blog post](#21-checklist--creating-a-complete-blog-post)

---

## 1. Architecture overview

```
CRM (forgex_crm)                          Public site (forgex / forgex.systems)
─────────────────                          ─────────────────────────────────────
BlogEditor + SEO panel                     /blog listing page
  ↓ POST /api/blog                         /blog/[slug] detail page
  ↓ createBlogPost()                         ↑
  ↓ INSERT INTO blog_posts                   │ anon key SELECT
  ↓                                          │ status = 'published'
  └──── Supabase DB (shared) ────────────────┘
           │
           └─── blog-covers storage bucket (cover + OG images)
```

Both apps share one Supabase project. The CRM writes; the public site reads published posts via the anon key with RLS enforced.

---

## 2. Database schema — every column

**Table: `blog_posts`** — 27 columns.

| Column | Type | Default | Who sets it | Used by public site? |
|--------|------|---------|-------------|----------------------|
| `id` | uuid | auto | DB | Yes (internal ref) |
| `title` | text | — | Editor | Yes |
| `slug` | text (unique) | — | Server on create | Yes (URL) |
| `excerpt` | text | null | Editor (= seo_description) | Yes (subtitle, meta fallback) |
| `body` | jsonb | null | Editor | Yes (rendered as HTML) |
| `cover_image_url` | text | null | Cover upload | Yes (hero image) |
| `author_id` | uuid FK → profiles | session user | Server | Via join only |
| `category_id` | uuid FK → blog_categories | Editor | Server | Via join |
| `tags` | text[] | `'{}'` | Editor | Listing search only |
| `status` | enum | `'draft'` | Editor / status dropdown | WHERE filter only |
| `publish_date` | timestamptz | null | Schedule flow | Yes (displayed date) |
| `published_at` | timestamptz | null | DB trigger | Not directly |
| `seo_title` | text | null | SEO panel | Yes (`<title>`, og:title) |
| `seo_description` | text | null | SEO panel | Yes (meta, og:description) |
| `tldr` | text | null | SEO panel | Yes (callout box) |
| `canonical_url` | text | null | API (no UI) | Yes (canonical link) |
| `og_image_url` | text | null | OG generator (server) | Yes (og:image) |
| `reading_time_minutes` | smallint | null | Server (estimated) | Yes |
| `is_featured` | boolean | false | SEO panel (admin) | Yes (listing layout) |
| `allow_comments` | boolean | true | SEO panel | Yes (shows/hides comments) |
| `is_community_post` | boolean | false | Future | **No** |
| `community_author_id` | uuid | null | Future | **No** |
| `view_count` | bigint | 0 | Future analytics | Selected but not displayed |
| `faqs` | jsonb | null | SEO panel | Yes (FAQ section + schema) |
| `created_at` | timestamptz | now | DB | **No** |
| `updated_at` | timestamptz | now | Trigger + app | Yes (article modified date) |

---

## 3. CRM editor — what you fill in

When you open `/blog/new` or `/blog/[id]` in the CRM, the `BlogEditor` component shows:

### Main area (left)
| Field | Maps to | Notes |
|-------|---------|-------|
| **Title** | `title` | Large textarea at top; falls back to "Untitled" |
| **Cover image** | `cover_image_url` | Click to upload; stored in `blog-covers` bucket |
| **Body** | `body` | Markdown textarea (the editor named `TipTapEditor` is actually a Markdown textarea, not TipTap) |

### SEO & Publishing panel (right)
| Field | Maps to | Notes |
|-------|---------|-------|
| SEO Title | `seo_title` | Max 60 chars; overrides `title` in `<title>` tag |
| Short Summary | `seo_description` + `excerpt` | Max 160 chars; also written to `excerpt` |
| TL;DR | `tldr` | Max 500 chars; rendered as a callout on public site |
| Google Preview | display only | Shows `forgex.systems › blog › {slug}` |
| FAQs | `faqs` | Q&A pairs; rendered as FAQ section + FAQPage schema |
| Category | `category_id` | Dropdown (admin can create new) |
| Tags | `tags` | Comma-separated → array |
| Publish Date | `publish_date` | Visible when scheduled |
| Allow Comments | `allow_comments` | Checkbox |
| Featured | `is_featured` | Admin-only checkbox |

### Header bar
| Action | Effect |
|--------|--------|
| Save Draft | Saves with `status: 'draft'` |
| Publish | Saves with `status: 'published'`; DB trigger sets `published_at` |
| Status dropdown | Change to draft / in_review / scheduled / published / archived |
| Preview | Opens `/blog/[id]/preview` in new tab |

---

## 4. Body format — how content is stored

The `body` column is `jsonb`. Two formats exist:

### New format (current editor)

```json
{
  "type": "markdown",
  "body": "## What We Built\n\nA paragraph with **bold** and a list:\n\n- item one\n- item two\n\n> A blockquote\n\n```js\nconsole.log('code')\n```"
}
```

The `body` property is a raw Markdown string. The CRM editor is a `<textarea>` with a toolbar that inserts Markdown syntax (`**`, `##`, `-`, etc.).

### Legacy format (old editor, existing posts)

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
      "content": [{ "type": "text", "text": "..." }]
    },
    {
      "type": "bulletList",
      "content": [
        { "type": "listItem", "content": [...] }
      ]
    }
  ]
}
```

This is TipTap/ProseMirror JSON from the old editor. All 10 currently published posts use this format.

### Detection logic

```
docToMarkdown(content):
  if content.type === 'markdown' && content.body is string → return body string
  else → return '__LEGACY_TIPTAP__' (editor shows view-only banner)
```

---

## 5. Save payload — what goes to the API

When you click Save Draft or Publish, `buildPayload()` in BlogEditor sends:

```typescript
{
  title: title.trim() || 'Untitled',
  excerpt: seoDesc || null,              // mirrors seo_description
  body: body ?? null,                    // { type: 'markdown', body: '...' }
  cover_image_url: coverUrl,
  category_id: categoryId || null,
  tags: ['tag1', 'tag2'],
  status: 'draft' | 'published' | ...,
  seo_title: seoTitle || null,
  seo_description: seoDesc || null,
  tldr: tldr.trim() || null,
  // og_image_url is NOT sent — set server-side by OG generator
  is_featured: true | false,
  allow_comments: true | false,
  faqs: [{ question: '...', answer: '...' }] | null,
  publish_date: '2026-09-15' | null,
}
```

**Not sent by editor:** `slug` (server-generated on create), `canonical_url` (no UI), `og_image_url` (server-managed), `author_id` (session), `reading_time_minutes` (server-calculated).

---

## 6. Create flow — server + OG generation

```
User clicks "Save Draft" or "Publish" on a NEW post
  ↓
POST /api/blog → Zod validation
  ↓
createBlogPost() in blog.server.ts
  ├── slug = slugify(title), unique check
  ├── reading_time = estimateReadingTime(body)
  ├── is_featured forced false for non-admin
  ├── INSERT INTO blog_posts + .select('*, category')
  └── return enriched row (with author join)
  ↓
API returns response to client immediately
  ↓ (fire-and-forget, non-blocking)
uploadBlogOgImage(id, title)
  ├── generateBlogOgImage(title) → 1200×630 PNG via next/og
  ├── Upload to blog-covers/{postId}/og-image.png
  └── UPDATE blog_posts SET og_image_url = publicUrl
```

OG generation failure **never** blocks or fails post creation.

---

## 7. Update flow — what happens on save/autosave

```
User edits and saves (or autosave fires every 30s)
  ↓
PATCH /api/blog/[id] → Zod validation
  ↓
updateBlogPost(id, payload)
  ├── Permission check: admin/manager + author
  ├── reading_time recalculated if body changed
  ├── UPDATE blog_posts
  └── return enriched row
```

**No OG regeneration on update.** The OG image only fires on create. If you change the title, the OG image keeps the original title.

**Autosave** runs every 30s if the post exists, `canEdit`, dirty flag is true, and not currently saving. Sends the current status (does not force draft).

---

## 8. Cover image upload

```
User clicks cover area → <input type="file" accept="image/*">
  ↓
handleCoverUpload(file)
  ├── supabase.storage.from('blog-covers').upload(
  │     `{postId|'new'}/{timestamp}-{sanitized-filename}`,
  │     file, { upsert: true }
  │   )
  ├── getPublicUrl → setCoverUrl(publicUrl)
  └── Persisted to blog_posts.cover_image_url on next save
```

Upload uses the **browser** Supabase client (anon key + user session). File stored in `blog-covers` bucket (public for CDN).

---

## 9. OG image generation

**File:** `src/lib/og/generateBlogOgImage.tsx`

Uses `next/og` `ImageResponse` to render a 1200×630 branded PNG:
- Background: cream `#ffffe3`
- Left accent bar: ink `#10100e`
- Top label: "forgex.systems" in ink-40
- Center: post title in ink, font-weight 700
- Bottom: "FORGEX SYSTEMS" uppercase label
- Fonts: GeneralSans Regular/Semibold/Bold loaded from `src/assets/fonts/`

Title handling:
- ≤50 chars → 56px
- ≤70 chars → 44px
- >70 chars → 36px
- Truncated at 80 chars with "..."

**Upload:** `src/lib/og/uploadBlogOgImage.ts`

Uses `createServiceClient()` (service role, bypasses RLS):
1. Generate PNG buffer
2. Upload to `blog-covers/{postId}/og-image.png` (upsert)
3. Get public URL
4. UPDATE `blog_posts.og_image_url`

---

## 10. SEO panel fields

### How each field is used on the public site

| CRM field | DB column | Public site usage |
|-----------|-----------|-------------------|
| SEO Title | `seo_title` | `<title>` tag: `"{seo_title} \| Forgex Systems"`, og:title, twitter:title |
| Short Summary | `seo_description` + `excerpt` | Meta description, og:description, header subtitle, listing cards |
| TL;DR | `tldr` | Callout box above body: `<div class="...border-l-ink bg-ink-06...">` |
| Category | via `blog_categories` join | Pill badge in sticky nav + listing cards |
| Tags | `tags` | Listing page search/filter only; **not displayed on detail page** |
| Cover Image | `cover_image_url` | Full-width hero image (16:9, `rounded-card-lg`) |
| OG Image | `og_image_url` | og:image, twitter:image (falls back to cover, then default) |
| Published Date | `publish_date` | "June 15, 2026" in header meta line |
| Reading Time | `reading_time_minutes` | "5 min read" in header meta line |
| Allow Comments | `allow_comments` | Shows/hides entire `CommentSection` |
| Featured | `is_featured` | First/hero card on listing page |
| FAQs | `faqs` | Rendered FAQ section + `FAQPage` JSON-LD schema |

---

## 11. TL;DR

| Aspect | Detail |
|--------|--------|
| DB column | `tldr text` |
| Editor | Textarea in SEO panel, max 500 chars |
| Saved as | `tldr: 'string'` or `null` |
| Public render | Wrapped in `<p>` tag inside a styled callout div |
| CRM preview | Same callout box (if set) |

**Public site rendering:**

```html
<div class="mb-8 rounded-card border border-ink-12 border-l-[3px] border-l-ink bg-ink-06 px-6 py-5 text-[15px] leading-[1.7] text-ink-80 [&_p]:m-0">
  <p>Your TL;DR text here</p>
</div>
```

When `tldr` is set in the DB, the public site also calls `stripTLDRFromBody()` to remove any leading TL;DR blockquote from legacy TipTap JSON (avoids duplicate rendering).

---

## 12. FAQs

| Aspect | Detail |
|--------|--------|
| DB column | `faqs jsonb` — `{ question: string, answer: string }[]` or `null` |
| Editor | Accordion in SEO panel; add/remove Q&A pairs |
| Saved as | Array of objects (empty pairs filtered out), or `null` |

**Public site rendering:**

1. **FAQ section** — below body, above CTA: heading "Frequently Asked Questions" + each Q (h3, font-black) + A (paragraph)
2. **FAQPage JSON-LD schema** — structured data for search engines
3. **Fallback:** if `faqs` column is null, `extractFAQFromTipTap()` scans legacy body for headings ending in `?` followed by answer paragraphs

---

## 13. Categories & tags

### Categories

| Item | Detail |
|------|--------|
| Table | `blog_categories` (id, name, slug, description) |
| Seeded | AI & Automation, SaaS Development, CRM & Sales, Case Studies, Engineering, Business |
| Editor | Dropdown in SEO panel; admin can create new |
| Public listing | Filter tabs by category |
| Public detail | Pill badge in sticky header bar |

### Tags

| Item | Detail |
|------|--------|
| Column | `tags text[]` |
| Editor | Comma-separated input → array |
| Public listing | Used for client-side search/filter |
| Public detail | **Not displayed** on the post page |

---

## 14. Status & publishing

| Status | Meaning | Visible to public? |
|--------|---------|---------------------|
| `draft` | Work in progress | No |
| `in_review` | Awaiting review | No |
| `scheduled` | Will publish at `publish_date` | No (no auto-publish job) |
| `published` | Live | **Yes** |
| `archived` | Hidden | No |

The public site only queries `WHERE status = 'published'`.

**DB trigger:** When status changes to `published`, trigger sets `published_at = COALESCE(published_at, now())`. This is never cleared.

**Scheduled status:** Sets `publish_date` but there is **no cron job** to automatically flip scheduled → published. Must be done manually.

---

## 15. Public site — how it fetches posts

**File:** `src/lib/blog.ts` in forgex repo.

Uses `supabaseServer` (anon key, no session, RLS enforced).

### Listing query (`getPublishedPosts`)

```sql
SELECT
  id, title, slug, excerpt, cover_image_url, tags,
  publish_date, published_at, updated_at, reading_time_minutes,
  is_featured, seo_title, seo_description,
  blog_categories!category_id (id, name, slug, description),
  profiles!author_id (full_name, avatar_url)
FROM blog_posts
WHERE status = 'published'
ORDER BY publish_date DESC
```

### Detail query (`getPostBySlug`)

Same as above **plus**: `body, og_image_url, canonical_url, allow_comments, view_count, tldr, faqs`

```sql
WHERE slug = '{slug}' AND status = 'published'
LIMIT 1  (.single())
```

ISR revalidation: `3600` seconds (1 hour). Static params generated from `getAllPublishedSlugs()`.

---

## 16. Public site — how it renders the body

**File:** `src/lib/tiptap-renderer.ts` in forgex repo.

```
renderTipTapToHTML(body):
  if body.type === 'markdown' → marked.parse(body.body)       // Markdown → HTML
  if body.type === 'doc'      → generateHTML(body, extensions) // TipTap → HTML
  else                        → '' (error logged)
```

### TipTap extensions registered for rendering

```
StarterKit, Image, Link, Underline, TextAlign, Highlight,
TextStyle, Table, TableRow, TableHeader, TableCell,
TaskList, TaskItem, Subscript, Superscript
```

### CSS for rendered HTML

The HTML is injected via `dangerouslySetInnerHTML` inside `<div class="blog-prose">`.

**Styles defined in `globals.css`** (`.blog-prose` class):

| Element | Styles |
|---------|--------|
| Root | `font-size: 15px`, `line-height: 1.75`, `color: ink-80` |
| `h2` | `clamp(22px, 3vw, 28px)`, `font-weight: 900`, ink, tight tracking |
| `h3` | `clamp(18px, 2.5vw, 22px)`, `font-weight: 900`, ink |
| `p` | `margin-top: 1.25em` |
| `strong` | `font-weight: 700`, ink |
| `a` | ink, underline, `underline-offset: 3px` |
| `ul` | No list-style; custom 6px ink circle bullets via `::before` |
| `ol` | `list-style: decimal`, `padding-left: 1.5em` |
| `blockquote` | Ink left border (3px), `bg-ink-06`, rounded right corners |
| `code` | Menlo/Monaco, `bg-ink-06`, 4px radius |
| `pre` | Ink background (#10100e), cream text, 12px radius |
| `hr` | `border-top: 1px solid ink-12` |
| `img` | 12px radius, full width |
| `table` | Collapsed borders, 14px font |
| Task lists | Flex layout, checkbox |

---

## 17. Public site — page layout & metadata

### Metadata (`generateMetadata`)

| Meta | Source |
|------|--------|
| `<title>` | `{seo_title ?? title} \| Forgex Systems` |
| `meta description` | `seo_description ?? excerpt` |
| `canonical` | `canonical_url ?? https://www.forgex.systems/blog/{slug}` |
| `og:image` | `og_image_url ?? cover_image_url ?? /og-image.png` |
| `og:type` | `article` |
| `og:publishedTime` | `publish_date` |
| `og:modifiedTime` | `updated_at` |
| `twitter:card` | `summary_large_image` |

### JSON-LD schemas

1. **Article** — headline, author (Hamza Iqbal), publisher (Forgex Systems), dates, image, URL
2. **FAQPage** — only if FAQs exist (DB `faqs` column or extracted from body)

### Page layout (top to bottom)

1. **Sticky nav bar** — "← All posts" link + category pill
2. **Header** — h1 title, excerpt subtitle, author name, publish date, reading time
3. **Cover image** — full-width 16:9, `rounded-card-lg` (if set)
4. **TL;DR callout** — bordered box with left ink accent (if set)
5. **Body (first 3 paragraphs)** — `.blog-prose` div
6. **Inline opt-in** — email subscribe form (InlineOptIn component)
7. **Body (rest)** — `.blog-prose` div
8. **FAQs section** — "Frequently Asked Questions" + Q&A pairs (if any)
9. **CTA section** — "Work with Forgex" + email link
10. **Related posts** — 3-column grid of same-category posts
11. **Comment section** — if `allow_comments` is true

---

## 18. Public site — comments & subscriber capture

### Comments

- **Component:** `CommentSection` (client-side)
- **Load:** Server-side `getApprovedComments(postId)` → passed as `initialComments`
- **Auth flow:** Email OTP verification for first-time commenters
- **Status:** Comments are `pending` until approved in CRM
- **Display:** Thread view, team replies marked as "Hamza Iqbal"

### Subscriber capture

- **Component:** `InlineOptIn` — inserted between 3rd and 4th paragraph of every post
- **Action:** POST `/api/blog/subscribe` with `{ email, source_post_slug }`
- **Backend:** Upserts into `blog_subscribers` (email as unique key)

---

## 19. Column cross-reference — CRM writes vs public reads

| Column | CRM writes | Public listing reads | Public detail reads |
|--------|------------|---------------------|---------------------|
| `id` | auto | ✅ | ✅ |
| `title` | ✅ | ✅ | ✅ |
| `slug` | ✅ (create) | ✅ | ✅ |
| `excerpt` | ✅ | ✅ | ✅ |
| `body` | ✅ | ❌ | ✅ |
| `cover_image_url` | ✅ | ✅ | ✅ |
| `author_id` | ✅ | via join | via join |
| `category_id` | ✅ | via join | via join |
| `tags` | ✅ | ✅ | ✅ |
| `status` | ✅ | WHERE only | WHERE only |
| `publish_date` | ✅ | ✅ | ✅ |
| `published_at` | trigger | ✅ | ✅ |
| `seo_title` | ✅ | ✅ | ✅ |
| `seo_description` | ✅ | ✅ | ✅ |
| `tldr` | ✅ | ❌ | ✅ |
| `canonical_url` | API only | ❌ | ✅ |
| `og_image_url` | OG gen | ❌ | ✅ |
| `reading_time_minutes` | server | ✅ | ✅ |
| `is_featured` | ✅ | ✅ | ❌ (listing only) |
| `allow_comments` | ✅ | ❌ | ✅ |
| `view_count` | future | ❌ | ✅ (not displayed) |
| `faqs` | ✅ | ❌ | ✅ |
| `is_community_post` | future | ❌ | ❌ |
| `community_author_id` | future | ❌ | ❌ |
| `created_at` | auto | ❌ | ❌ |
| `updated_at` | trigger | ✅ | ✅ |

---

## 20. Rendering differences — CRM preview vs public site

| Aspect | CRM preview | Public site |
|--------|-------------|-------------|
| **File** | `blog/[id]/preview/page.tsx` | `blog/[slug]/page.tsx` |
| **Markdown renderer** | `ReactMarkdown` + `remarkGfm` | `marked.parse()` → raw HTML |
| **TipTap renderer** | Custom React `renderTipTapNode()` | `@tiptap/html` `generateHTML()` |
| **Output** | React elements | HTML string via `dangerouslySetInnerHTML` |
| **CSS wrapper** | `.docs-preview .prose` | `.blog-prose` |
| **Font** | CRM system font | GeneralSans |
| **Colors** | CRM CSS variables | Cream/ink tokens |
| **Shared component?** | **No** | **No** — completely separate implementations |

They render the **same data** but with **different code paths and styling**. Small rendering differences are expected.

---

## 21. Checklist — creating a complete blog post

Before publishing, ensure all these fields are filled:

| Field | Required? | Why it matters |
|-------|-----------|----------------|
| **Title** | ✅ Yes | h1, og:title, JSON-LD headline |
| **Body** | ✅ Yes | The article content |
| **SEO Title** | Recommended | Overrides title in `<title>` tag (≤60 chars) |
| **Short Summary** | Recommended | Meta description + excerpt shown on listing cards (≤160 chars) |
| **TL;DR** | Optional | Callout box above the body (≤500 chars) |
| **Cover Image** | Recommended | Hero image on page + listing cards + og:image fallback |
| **Category** | Recommended | Listing filter + category pill on page |
| **Tags** | Optional | Listing search only; not shown on post page |
| **FAQs** | Optional | FAQ section + structured data for search engines |
| **Allow Comments** | Default on | Uncheck to hide comment section |
| **Featured** | Admin only | Places post as hero card on listing page |
| **Publish Date** | Auto on publish | Shown as article date; override for scheduled |

### What happens automatically

| Thing | When | How |
|-------|------|-----|
| `slug` | On create | `slugify(title)` + uniqueness check |
| `reading_time_minutes` | On create/update | Word count ÷ 200 from body JSON |
| `published_at` | On publish | DB trigger, set once |
| `og_image_url` | On create | Background PNG generation + upload |
| `excerpt` | On save | Mirrored from `seo_description` |
| `updated_at` | On every save | DB trigger |

### After publishing

- Post visible at `https://www.forgex.systems/blog/{slug}` within ISR window (≤1 hour)
- OG image available at the Supabase storage URL (set within seconds of create)
- Comments section visible if `allow_comments` is true
- Subscriber opt-in form injected after 3rd paragraph

---

*Generated from audit of `forgex_crm` and `forgex` codebases. No changes made.*
