# Forgex CRM — Blog Comments System

**Last reviewed:** August 2026  
**Scope:** How blog comments are stored, moderated, and exposed — and what the CRM does vs what the public site (`forgex.systems`) is expected to do.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Architecture (who owns what)](#2-architecture-who-owns-what)
3. [Database schema](#3-database-schema)
4. [Row Level Security (RLS)](#4-row-level-security-rls)
5. [Status workflow](#5-status-workflow)
6. [Who can create comments](#6-who-can-create-comments)
7. [CRM server layer](#7-crm-server-layer)
8. [CRM API routes](#8-crm-api-routes)
9. [CRM UI (moderation)](#9-crm-ui-moderation)
10. [Hooks, permissions, query keys](#10-hooks-permissions-query-keys)
11. [Notifications (scaffolded only)](#11-notifications-scaffolded-only)
12. [Relation to blog posts](#12-relation-to-blog-posts)
13. [Threading (schema vs UI)](#13-threading-schema-vs-ui)
14. [Public site (forgex.systems) contract](#14-public-site-forgexsystems-contract)
15. [Gaps and incomplete pieces](#15-gaps-and-incomplete-pieces)
16. [End-to-end flows](#16-end-to-end-flows)
17. [File index](#17-file-index)

---

## 1. Executive summary

Blog comments in Forgex are a **shared-Supabase** feature:

| Layer | Responsibility |
|-------|----------------|
| **Database** | `blog_comments` + `community_users` + RLS |
| **Public site (`forgex.systems`)** | Comment form, auth as community user, insert pending comments, show **approved** comments |
| **CRM (`forgex_crm`)** | Per-post list in the blog editor; **approve / reject / delete**; toggle `allow_comments` on the post |

**What the CRM does today**

- List comments for a post
- Approve / reject (admin & manager)
- Delete (admin only)
- Toggle “Allow Comments” on the post (`blog_posts.allow_comments`)

**What the CRM does *not* do today**

- No public comment form
- No `POST` API to create comments
- No global moderation inbox
- No nested reply UI
- No `comment_needs_moderation` notifications fired
- Community author names shown as hardcoded `"Community"` (no join to `community_users.display_name`)

---

## 2. Architecture (who owns what)

```
┌─────────────────────┐         shared Supabase          ┌─────────────────────┐
│  forgex.systems     │◄────────────────────────────────►│  forgex_crm         │
│  (public blog)      │                                  │  (internal CRM)     │
│                     │                                  │                     │
│  • Community auth   │   blog_comments / community_users │  • Blog editor UI   │
│  • Comment form     │                                  │  • Moderate/delete  │
│  • Show approved    │                                  │  • allow_comments   │
└─────────────────────┘                                  └─────────────────────┘
```

Comments are **not** created inside the CRM UI. They are designed to be inserted by authenticated **community users** (or optionally team members via RLS) against the same database the CRM moderates.

Folder note: `src/server/blog-comments/` exists only as a `.gitkeep` stub. Live logic lives in `src/server/blog/blog.server.ts`.

---

## 3. Database schema

### 3.1 Enum: `blog_comment_status`

Defined in `supabase/migrations/00_core/001_extensions_and_enums.sql`:

```sql
create type blog_comment_status as enum ('pending', 'approved', 'rejected');
```

There is **no** `spam` (or similar) status.

### 3.2 Table: `community_users`

Visitor-facing accounts for comments (and future community posts).

| Column | Notes |
|--------|--------|
| `id` | UUID PK |
| `email` | Unique |
| `display_name`, `avatar_url`, `bio` | Public display |
| `auth_user_id` | FK → `auth.users` (nullable) |
| timestamps | `created_at` / `updated_at` |

Comment in migration: *“Visitor-facing accounts for blog comments and future community posts.”*

### 3.3 Table: `blog_comments`

From `supabase/migrations/05_blog/001_blog.sql`:

| Column | Type | Notes |
|--------|------|--------|
| `id` | `uuid` PK | |
| `post_id` | `uuid` NOT NULL | FK → `blog_posts` **ON DELETE CASCADE** |
| `community_user_id` | `uuid` nullable | FK → `community_users` **ON DELETE CASCADE** |
| `team_user_id` | `uuid` nullable | FK → `profiles` **ON DELETE CASCADE** |
| `parent_comment_id` | `uuid` nullable | Self-FK for replies **ON DELETE CASCADE** |
| `content` | `text` NOT NULL | Comment body |
| `status` | `blog_comment_status` | Default **`pending`** |
| `reviewed_by` | `uuid` nullable | FK → `profiles` **ON DELETE SET NULL** |
| `reviewed_at` | `timestamptz` nullable | |
| `rejection_reason` | `text` nullable | Set on reject (optional) |
| `created_at` / `updated_at` | `timestamptz` | |

**Author constraint** — exactly one author type:

```sql
constraint one_comment_author check (
  (community_user_id is not null)::int + (team_user_id is not null)::int = 1
)
```

Comment in migration: *“All go through moderation queue (`status=pending`) before showing.”*

### 3.4 Post flag: `blog_posts.allow_comments`

- `boolean NOT NULL DEFAULT true`
- Editable in CRM SEO / editor panel
- Intended to gate commenting on the **public site**; CRM server does not enforce it when listing or moderating

### 3.5 Indexes

From `10_indexes/001_indexes.sql`:

- `(post_id, status, created_at)` — listing / filtering
- `(parent_comment_id)` where not null — replies
- partial index on `status = 'pending'` — moderation queue

### 3.6 TypeScript types

`src/types/blog.ts`:

- `BlogCommentStatus` ← DB enum
- `BlogComment` ← row + optional `author: { full_name, avatar_url }`

Generated row shapes live in `src/types/database.types.ts`.

---

## 4. Row Level Security (RLS)

### 4.1 Core policies (`001_blog.sql`)

| Policy | Role | Operation | Rule |
|--------|------|-----------|------|
| `public_read_approved_comments` | `anon` | SELECT | `status = 'approved'` |
| `team_read_all_comments` | `authenticated` | SELECT | User has a `profiles` row |
| `team_insert_comments` | `authenticated` | INSERT | `team_user_id = auth.uid()` |
| `admin_manager_moderate_comments` | `authenticated` | UPDATE | `profiles.role` in (`admin`, `manager`) |

### 4.2 Public-site gap fill (`006_public_site_rls_gaps.sql`)

| Policy | Role | Operation | Rule |
|--------|------|-----------|------|
| `Community users can submit comments` | `authenticated` | INSERT | `community_user_id` belongs to `community_users` where `auth_user_id = auth.uid()` |
| Public read community display | `anon` | SELECT on `community_users` | `USING (true)` |
| Create / update own community profile | `authenticated` | INSERT / UPDATE | `auth_user_id = auth.uid()` |

### 4.3 Important gap: DELETE

There is **no DELETE policy** on `blog_comments`.  
CRM `deleteBlogComment` uses the user-scoped Supabase client. Under strict RLS, **admin deletes may fail** unless a service-role path or DELETE policy is added later.

---

## 5. Status workflow

```
                  insert (default)
                        │
                        ▼
                    ┌─────────┐
                    │ pending │
                    └────┬────┘
               ┌─────────┴─────────┐
               ▼                   ▼
         ┌──────────┐        ┌──────────┐
         │ approved │        │ rejected │
         └──────────┘        └──────────┘
               │
               ▼
     Visible to anon / public site
```

| Transition | Who | Effect |
|------------|-----|--------|
| → `pending` | Insert default | Waiting for review |
| → `approved` | admin / manager | Public-readable via anon RLS |
| → `rejected` | admin / manager | Hidden from public; optional `rejection_reason` |

API schema also allows PATCH back to `pending`. The CRM UI only offers Approve / Reject from the pending state (no reason prompt in UI).

---

## 6. Who can create comments

| Actor | Can insert? | Mechanism |
|-------|-------------|-----------|
| Community user (public site) | **Yes** | RLS insert with their `community_user_id` |
| Team member (`profiles`) | **Yes (RLS only)** | `team_user_id = auth.uid()` — **no CRM UI/API for this** |
| Anonymous visitor | **No** | Can only SELECT approved |
| Client portal user | **No** | No portal comment code |
| CRM itself | **No create path** | Only GET / PATCH / DELETE |

Default on insert: **`status = 'pending'`**.

---

## 7. CRM server layer

File: `src/server/blog/blog.server.ts`

### `getBlogComments(postId)`

1. `requireSession()`
2. SELECT `*` from `blog_comments` where `post_id`, order `created_at` desc
3. Hydrate team authors from `profiles`
4. Community authors → hardcoded `{ full_name: 'Community', avatar_url: null }`  
   (**does not join `community_users.display_name`**)

### `moderateBlogComment(id, status, rejectionReason?)`

1. Requires role **admin** or **manager**
2. UPDATE: `status`, `reviewed_by`, `reviewed_at`, `rejection_reason` (cleared unless rejected)

### `deleteBlogComment(id)`

1. Requires role **admin**
2. DELETE via user client (see RLS DELETE gap above)

**Not implemented:** create comment, list-all-pending across posts, reply helpers, notify-on-insert.

---

## 8. CRM API routes

| Method | Path | Handler |
|--------|------|---------|
| `GET` | `/api/blog/[id]/comments` | `getBlogComments(id)` |
| `PATCH` | `/api/blog/[id]/comments/[commentId]` | body `{ status, rejection_reason? }` → `moderateBlogComment` |
| `DELETE` | `/api/blog/[id]/comments/[commentId]` | `deleteBlogComment` |

There is **no `POST`** create-comment route in the CRM.

PATCH body (Zod):

```ts
z.object({
  status: z.enum(['pending', 'approved', 'rejected']),
  rejection_reason: z.string().nullable().optional(),
})
```

Auth for these routes: CRM session via `proxy.ts` + server `requireSession` / role checks inside the server functions.

---

## 9. CRM UI (moderation)

### Where it lives

**Only inside the blog post editor** (`BlogEditor`), when a `postId` exists.

Not a standalone `/blog/comments` moderation page.

### Behaviour

- Section: **Comments (N)**
- Flat list (no nesting by `parent_comment_id`)
- Each row: avatar, author name, status badge, content
- If pending and `canModerateComments` → **Approve** / **Reject**
- If admin → **Delete**
- Empty state: “No comments yet”
- Reject does **not** collect `rejection_reason` in the UI

### Allow comments toggle

`BlogSeoPanel` / editor state → saved as `blog_posts.allow_comments`.

---

## 10. Hooks, permissions, query keys

### Permissions (`src/lib/blog-permissions.ts`)

```ts
canModerateComments(profile) // admin || manager
```

Delete is further restricted to **admin** in the server function (UI also gates delete on admin).

### Hooks (`src/hooks/useBlog.ts`)

| Hook | Purpose |
|------|---------|
| `useBlogComments(postId)` | Fetch list for editor |
| `useModerateComment()` | PATCH status |
| `useDeleteBlogComment()` | DELETE |

Query keys live under `src/lib/query/keys.ts` (blog comments keyed by post id).

---

## 11. Notifications (scaffolded only)

| Piece | Status |
|-------|--------|
| DB / TS type `comment_needs_moderation` | Defined |
| Reference type `blog_comment` | Defined |
| Notification config (icon/color) | Wired |
| Notifications UI filter / panel | Can display type if created |
| Panel deep-link | Goes to `/blog` (not post/comment) |
| **`createNotification({ type: 'comment_needs_moderation' })`** | **Never called** |
| Email for this type | **None** |

Admins are **not** currently notified when a new pending comment arrives.

---

## 12. Relation to blog posts

- Comments belong to one post via `post_id`
- Deleting a post **cascades** delete of its comments
- CRM always scopes APIs as `/api/blog/{postId}/comments`
- `allow_comments` is a post-level switch for the public product; CRM moderation still lists comments even if the flag is off

---

## 13. Threading (schema vs UI)

| Layer | Support |
|-------|---------|
| Schema | `parent_comment_id` self-FK + index |
| RLS | No special reply rules (same insert policies) |
| CRM UI | Flat chronological list — **no reply tree** |
| CRM API | No dedicated reply endpoint |

Replies are data-model ready; product UI is not.

---

## 14. Public site (`forgex.systems`) contract

What the database assumes the public site will do:

1. User signs in as a **community** identity (`community_users.auth_user_id`)
2. If `blog_posts.allow_comments` (and post is published), submit comment with `community_user_id` + `post_id` + `content` → lands as **`pending`**
3. Anon (or public page) reads comments with `status = 'approved'`
4. Display author from `community_users` (anon SELECT allowed after `006`)

CRM does **not** host that form. Phase 4 community auth on the public site is what is expected to drive inserts.

---

## 15. Gaps and incomplete pieces

1. **`src/server/blog-comments/`** — stub only; logic in `blog.server.ts`
2. **No create-comment API/UI** in CRM
3. **`comment_needs_moderation` never emitted**
4. **Threading UI missing** despite `parent_comment_id`
5. **Community author display** hardcoded as `"Community"`
6. **No DELETE RLS policy** — admin delete may fail under RLS
7. **No global pending-comments inbox** — only per post in editor
8. **`rejection_reason` unused** in UI
9. **`allow_comments` not enforced** in CRM server paths
10. **Notification deep-link** is `/blog`, not the specific post
11. **No spam** status/workflow

---

## 16. End-to-end flows

### A. Community comment → public visibility (intended)

```
Public site: community user submits comment
  → INSERT blog_comments (status=pending) via RLS
  → (notification not implemented)
CRM: open post editor → Comments section
  → Admin/Manager Approve
  → status=approved, reviewed_by/reviewed_at set
Public site: anon SELECT approved comments → visible
```

### B. Reject

```
CRM: Reject pending comment
  → status=rejected
  → rejection_reason optional (API supports; UI does not collect)
  → remains hidden from anon
```

### C. Delete

```
CRM: Admin Delete
  → DELETE row (may hit RLS gap)
```

### D. Disable commenting on a post

```
CRM: uncheck Allow Comments → save post
  → allow_comments=false
  → Public site should refuse new submissions (CRM does not enforce)
```

---

## 17. File index

### Migrations

- `supabase/migrations/00_core/001_extensions_and_enums.sql`
- `supabase/migrations/05_blog/001_blog.sql`
- `supabase/migrations/05_blog/006_public_site_rls_gaps.sql`
- `supabase/migrations/10_indexes/001_indexes.sql`

### Types

- `src/types/blog.ts`
- `src/types/database.types.ts`
- `src/types/notifications.ts`

### Server / API

- `src/server/blog/blog.server.ts`
- `src/server/blog-comments/.gitkeep`
- `src/app/api/blog/[id]/comments/route.ts`
- `src/app/api/blog/[id]/comments/[commentId]/route.ts`

### Hooks / permissions

- `src/hooks/useBlog.ts`
- `src/lib/blog-permissions.ts`
- `src/lib/query/keys.ts`

### UI

- `src/components/blog/BlogEditor.tsx`
- `src/components/blog/BlogSeoPanel.tsx`

### Notifications (scaffold)

- `src/constants/notification-config.ts`
- `src/components/notifications/NotificationPanel.tsx`

### Unrelated (do not confuse)

Task comments use different tables/routes:

- `src/app/api/tasks/[id]/comments/...`

---

*This document describes the blog comment system as implemented in the Forgex CRM codebase. It does not change runtime behaviour.*
