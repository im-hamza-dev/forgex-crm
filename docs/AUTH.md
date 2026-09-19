# Forgex CRM — Authentication System Report

**Last reviewed:** August 2026  
**Scope:** How auth is implemented today — roles, signup/invite flows, session gating, schema, and how the database is wired to Supabase Auth.

---

## Table of contents

1. [Executive summary](#1-executive-summary)
2. [Auth stack](#2-auth-stack)
3. [Roles and permissions](#3-roles-and-permissions)
4. [Database schema](#4-database-schema)
5. [How a user gets an account](#5-how-a-user-gets-an-account)
6. [Login, logout, password reset, Google OAuth](#6-login-logout-password-reset-google-oauth)
7. [Route gating (`proxy.ts`)](#7-route-gating-proxyts)
8. [Server session helpers](#8-server-session-helpers)
9. [API auth patterns](#9-api-auth-patterns)
10. [Client portal vs CRM dashboard](#10-client-portal-vs-crm-dashboard)
11. [Invite emails and links](#11-invite-emails-and-links)
12. [Setup / first admin bootstrap](#12-setup--first-admin-bootstrap)
13. [End-to-end flow diagrams](#13-end-to-end-flow-diagrams)
14. [Known gaps and caveats](#14-known-gaps-and-caveats)
15. [File index](#15-file-index)

---

## 1. Executive summary

Forgex CRM is an **invite-only** system on **Supabase Auth**.

| Audience | How they join | Where they land | Role source |
|----------|---------------|-----------------|-------------|
| Team (admin / manager / member) | Admin invites via Supabase `inviteUserByEmail` | `/accept-invite` → `/dashboard` | `profiles.role` from `invited_role` metadata |
| Client | Admin/manager invites via `auth.admin.generateLink` + branded email | `/portal/accept` → `/portal/:projectId` | `profiles.role = 'client'` + `client_accounts` row |
| Random Google / email signup | Blocked | Login error `not_invited` | Deleted or rejected in OAuth callback / proxy |

There is **no public self-registration** for the CRM. Access is gated by:

1. A row in `auth.users` (Supabase)
2. A matching `profiles` row with `is_active = true`
3. For clients, an additional `client_accounts` row linked by `auth_user_id`
4. Next.js **`src/proxy.ts`** (App Router request proxy — replaces classic middleware)
5. Server helpers `requireSession` / `requireRole` on API and server functions

---

## 2. Auth stack

### Packages

- `@supabase/ssr` — browser + cookie-aware server clients
- `@supabase/supabase-js` — service-role admin client
- Next.js 16 App Router — auth routes under `src/app/api/auth/*`, UI under `src/app/(auth)/*`

### Clients

| Client | File | Key | Purpose |
|--------|------|-----|---------|
| Browser | `src/lib/supabase/client.ts` | Anon | Client components, login UI, `onAuthStateChange` |
| Server | `src/lib/supabase/server.ts` | Anon + cookies | RSC, route handlers, `getUser()` / session |
| Service | `src/lib/supabase/service.ts` | Service role | Invites, proxy profile reads, portal data (bypasses RLS) |
| Inline in proxy | `src/proxy.ts` | Anon + request cookies | Refresh session cookies on each request |

### Environment

**Public (`src/constants/env.ts`):**

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

**Server-only (`src/constants/env.server.ts`):**

- `SUPABASE_SERVICE_ROLE_KEY`
- Email: `EMAIL_PROVIDER`, `RESEND_API_KEY`, `EMAIL_FROM`, optional Brevo SMTP

### Session model

- Cookie-based SSR sessions via `@supabase/ssr`
- Proxy refreshes cookies with `getSession()`
- Server helpers prefer `auth.getUser()` (more authoritative than trusting the JWT alone)
- Client state: Zustand `auth-store` + `useAuth` hook listening to `onAuthStateChange`

### Note on `middleware.ts`

`src/lib/supabase/middleware.ts` exports an `updateSession` helper, but **routing is handled by `src/proxy.ts`**, not a classic Next `middleware.ts` file. Treat `proxy.ts` as the source of truth for edge gating.

---

## 3. Roles and permissions

### Canonical roles

| Role | UI label | Stored in | Can access |
|------|----------|-----------|------------|
| `admin` | Admin | `profiles.role` | Full CRM |
| `manager` | Manager | `profiles.role` | Leads, projects, tasks, blog, calendar, docs, settings; can invite clients |
| `member` | Lead Generator | `profiles.role` | Own leads, tasks, docs, settings |
| `client` | Client | `profiles.role` + `client_accounts` | Client portal only |

Defined in `src/constants/roles.ts` as `TeamRole` and `ROLE_PERMISSIONS`.

### How roles are assigned

1. On `auth.users` **INSERT**, trigger `handle_new_user()` reads  
   `raw_user_meta_data.invited_role` → casts to `team_role` → inserts `profiles`.  
   If missing → defaults to **`member`**.
2. Team accept-invite may also sync `profiles.role` from metadata after password set.
3. Client invite metadata includes `invited_role: 'client'` and `is_client: true`.
4. Admins can change team member roles via team management (`updateMemberRole`) — with guards (e.g. cannot freely promote to admin / change own role depending on server rules).

### Permission matrix (`ROLE_PERMISSIONS` / proxy `ROLE_MAP`)

| Capability | admin | manager | member | client |
|------------|:-----:|:-------:|:------:|:------:|
| View leads | ✓ | ✓ | Own only | — |
| View all leads | ✓ | ✓ | ✗ | — |
| Projects | ✓ | ✓ | ✗ | Portal only |
| Tasks | ✓ | ✓ | ✓ | — |
| Blog / content calendar | ✓ | ✓ | ✗ | — |
| Docs | ✓ | ✓ | ✓ | — |
| Reports | ✓ | ✗ | ✗ | — |
| Team management | ✓ | ✗ | ✗ | — |
| Settings | ✓ | ✓ | ✓ | Portal settings |
| Invite team | ✓ | ✗ | ✗ | — |
| Invite client | ✓ | ✓ | ✗ | — |

Nav is filtered with `getNavForRole(role)` using the same permission model (`src/constants/nav.ts`).

---

## 4. Database schema

### 4.1 Enums (`00_core/001_extensions_and_enums.sql`)

```sql
create type team_role as enum ('admin', 'manager', 'member');
create type client_account_status as enum ('pending', 'active', 'revoked');
```

**Important:** Generated `database.types.ts` includes `"client"` on `team_role`, and the app invites clients with `invited_role: 'client'`. There is **no migration in-repo** that runs:

```sql
ALTER TYPE team_role ADD VALUE 'client';
```

The live Supabase project is assumed to have that value. A fresh migrate-from-SQL-only database may fail client invites until the enum is extended.

### 4.2 `profiles` (`01_auth/001_profiles.sql`)

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | FK → `auth.users(id)` ON DELETE CASCADE |
| `email` | `text` | From auth user |
| `full_name` | `text` | From metadata or email local-part |
| `avatar_url` | `text` | Optional |
| `role` | `team_role` | Default `'member'` |
| `is_active` | `boolean` | Soft disable; proxy signs out inactive users |
| `created_at` / `updated_at` | `timestamptz` | Auto |

**Trigger:** `on_auth_user_created` → `handle_new_user()` (security definer).

**RLS:**

- Active authenticated users can **SELECT** all profiles (assignee dropdowns, etc.)
- Users can **UPDATE** their own row
- Admins can **UPDATE** other profiles (role / `is_active`)

### 4.3 `client_accounts` (`01_auth/002_client_accounts.sql`)

Separate table for portal users — one client scoped to **one project**.

| Column | Type | Notes |
|--------|------|-------|
| `id` | `uuid` PK | |
| `email` | `text` | Invite target |
| `full_name` | `text` | |
| `company` | `text` | Optional |
| `project_id` | `uuid` | FK to `projects` (added in projects migration) |
| `invite_token` | `text` unique | Schema remnant — **current app does not use this**; uses Supabase `action_link` |
| `invite_sent_at` | `timestamptz` | |
| `status` | `client_account_status` | `pending` → `active` → `revoked` |
| `auth_user_id` | `uuid` | Set after invite / accept; FK → `auth.users` ON DELETE SET NULL |
| `created_by` | `uuid` | FK → `profiles` |

**RLS:** Only admin/manager can SELECT / INSERT / UPDATE.  
Portal runtime access uses the **service role** after verifying the session in application code (`requireClientSession`).

### 4.4 Link to projects

`projects.client_account_id` → `client_accounts.id`  
`client_accounts.project_id` → `projects.id`  

Together they bind a portal user to a single project.

### 4.5 How schema “tackles” auth

```
auth.users (Supabase Auth)
    │
    │ 1:1 CASCADE
    ▼
profiles (role, is_active) ──────────► CRM access decisions
    │
    │ created_by / team FKs
    ▼
client_accounts (status, auth_user_id, project_id)
    │
    │ 1:1 project
    ▼
projects + portal tables (tickets, docs visible to client)
```

- **Identity** lives in `auth.users`.
- **Authorization for the CRM** lives in `profiles.role` + `is_active`.
- **Authorization for the portal** lives in `client_accounts.status` + `auth_user_id` + project link.
- **RLS** protects team tables for authenticated team users; portal paths often use **service client** because clients are not given broad RLS SELECT policies on CRM tables.

---

## 5. How a user gets an account

### 5.1 Team invite (admin only)

```
Admin UI / Team page
  → POST /api/team/invite
  → inviteTeamMember() [requireRole(['admin'])]
  → auth.admin.inviteUserByEmail(email, {
       data: { full_name, invited_role: 'manager' | 'member' },
       redirectTo: APP_URL + '/accept-invite'
     })
  → Supabase sends invite email
  → User opens link → session (hash tokens or PKCE callback)
  → /accept-invite: set password (≥ 8 chars)
  → optionally sync profiles.role from metadata
  → redirect /dashboard
```

- Invite role options: **manager** or **member** only (`INVITE_ROLE_OPTIONS`).
- Admins are not created through this invite form.
- Pending invites can be listed via `auth.admin.listUsers()` (unconfirmed + `invited_at`); client invites are filtered out of the Team UI.

### 5.2 Client invite (admin or manager)

```
Project → Invite Client
  → POST /api/projects/:id/invite-client
  → inviteClient() [requireRole(['admin','manager'])]
  → INSERT client_accounts (status: pending)
  → auth.admin.generateLink({
       type: 'invite',
       email,
       options: {
         data: {
           invited_role: 'client',
           is_client: true,
           full_name, company, project_id
         },
         redirectTo: APP_URL + '/portal/accept'
       }
     })
  → Link auth_user_id on client_accounts
  → sendClientInviteEmail({ inviteUrl: action_link })  // Resend or Brevo
  → Set projects.client_account_id
  → Client opens link → /portal/accept → set password
  → POST /api/portal/activate → status active
  → /portal/:projectId
```

Rules:

- Only **one** pending/active client invite per project.
- If invite/link creation fails, the pending `client_accounts` row is rolled back (deleted).

### 5.3 Accept pages

| Audience | Path | What happens |
|----------|------|----------------|
| Team | `/accept-invite` | Read hash tokens → `setSession` → set password → dashboard |
| Client | `/portal/accept` | Same session pattern → activate API → portal project |

---

## 6. Login, logout, password reset, Google OAuth

### Login (`/login`)

1. **Email / password:** `signInWithPassword` → hard navigate to `redirectTo` (default `/dashboard`).
2. **Google:** `signInWithOAuth({ provider: 'google', redirectTo: .../api/auth/callback?next=... })`.
3. Query string errors surfaced in UI: `not_invited`, `access_revoked`, `account_inactive`, etc.

### Logout

- Client: `useAuth().signOut` → `POST /api/auth/signout` → clear store → `/login`.
- Settings can call global sign-out (`scope: 'global'`) to revoke all sessions.

### Password reset

1. `/forgot-password` → `resetPasswordForEmail` with redirect to  
   `/api/auth/callback?next=/reset-password`
2. Callback exchanges code → session → `/reset-password`
3. `updateUser({ password })` → sign out → login again

In-session password change:

- Team: settings API / `settings.server.changePassword` (re-verify current password)
- Portal: `PATCH /api/portal/settings?action=password`

### Google / PKCE callback (`/api/auth/callback`)

After `exchangeCodeForSession(code)`:

| Condition | Result |
|-----------|--------|
| Client role/metadata or matching `client_accounts` | Activate if pending → `/portal/:projectId` |
| Client revoked / no account | Sign out → `access_revoked` / `not_invited` |
| No `profiles` row | Delete auth user → `not_invited` |
| `is_active = false` | Sign out → `account_inactive` |
| Non-admin without `invited_role` | Delete profile + auth user → `not_invited` (blocks random Google signups) |
| Has `invited_role` (team) | → `/accept-invite` |
| Otherwise | → `next` query or dashboard |

This callback is the **hard gate** that keeps Google OAuth invite-only.

---

## 7. Route gating (`proxy.ts`)

File: `src/proxy.ts`  
Matcher: all routes except static `_next` assets and common image extensions.

### Public paths (no session required)

```
/login
/forgot-password
/reset-password
/accept-invite
/portal/accept
/privacy
/manifest.json
/portal/manifest.webmanifest
/portal/manifest
/sw.js
/google74af155327ae2e69.html
/api/auth   (prefix — callback + signout)
```

**Not public:** `/setup` — anonymous visitors are redirected to login.

### Decision flow

```
Request
  │
  ├─ Public path? → next()
  │
  ├─ Refresh cookies; getSession()
  │     └─ No session → API 401 JSON / else redirect /login
  │
  ├─ Service client: load profiles.role, is_active
  │     ├─ No profile → signOut → not_invited
  │     └─ Inactive → signOut → account_inactive
  │
  ├─ role === 'client'?
  │     ├─ Allowed: /portal/*, /api/portal/*, /api/auth*, /api/notifications*
  │     │     └─ Validate client_accounts; /portal → /portal/:project_id
  │     └─ Else → redirect /portal
  │
  ├─ Team on /portal? → redirect /dashboard
  │
  ├─ /api/* (team) → next()  (fine-grained checks in server layer)
  │
  └─ Page route in ROUTE_PERMISSION_MAP?
        └─ Missing permission → /dashboard
```

Cookie-preserving redirects use `redirectWithCookies` so session cookies set during the request are not lost.

---

## 8. Server session helpers

File: `src/server/shared/require-session.ts`

| Helper | Behavior |
|--------|----------|
| `getSession()` | `getUser()` + load `profiles` (`role`, `is_active`, name, avatar) |
| `requireSession()` | Requires a role; throws `UnauthorizedError` / `ForbiddenError` |
| `requireRole(roles[])` | Ensures role is in the allowed list |

**Portal equivalent:** private `requireClientSession()` in `src/server/client-portal/portal.server.ts`:

- `getUser()`
- Service lookup of `client_accounts` by `auth_user_id`
- Rejects missing or `revoked`

Errors map via `handleRouteError` → HTTP 401 / 403 / 400 / 500.

---

## 9. API auth patterns

| Pattern | Used by | How |
|---------|---------|-----|
| **A. Proxy + `requireRole`** | Most CRM APIs | Session required by proxy; server function enforces role |
| **B. Proxy only for `/api/*`** | Team APIs | Proxy does **not** re-check CRM route permissions for APIs; servers must call `require*` |
| **C. Portal APIs** | `/api/portal/*` | Proxy allows clients; handlers call `requireClientSession` / activate |
| **D. Public auth routes** | `/api/auth/*` | Listed under public paths |
| **E. Ad-hoc `getUser`** | Some portal settings / activate | Direct checks in the route |

Example: `POST /api/team/invite` → `inviteTeamMember` → `requireRole(['admin'])`.  
Example: `POST /api/projects/:id/invite-client` → `inviteClient` → `requireRole(['admin','manager'])`.

---

## 10. Client portal vs CRM dashboard

| | CRM dashboard | Client portal |
|--|---------------|---------------|
| Route group | `(dashboard)/*` | `(client-portal)/portal/*` |
| Roles | admin, manager, member | client |
| Extra DB row | — | `client_accounts` |
| Proxy behavior | Role → page permission map | Forced portal-only; CRM URLs redirect to `/portal` |
| Data access | User-scoped Supabase + occasional service | Mostly **service client** after session check |
| Invite mechanism | Supabase invite email | `generateLink` + Resend/Brevo HTML |
| Accept UX | `/accept-invite` | `/portal/accept` + `/api/portal/activate` |
| Disable access | `profiles.is_active = false` (+ optional auth ban) | `client_accounts.status = 'revoked'` |
| PWA | — | Portal-scoped manifest + SW (static assets only) |

Team users who open `/portal` are redirected to the dashboard.  
Clients who open CRM routes are redirected to the portal.

---

## 11. Invite emails and links

### Team

- **API:** `auth.admin.inviteUserByEmail`
- **Email sender:** Supabase Auth (managed templates)
- **Redirect:** `{APP_URL}/accept-invite`
- **Token:** Supabase invite / recovery tokens in the email link

### Client

- **API:** `auth.admin.generateLink({ type: 'invite' })`
- **URL used in email:** `properties.action_link`
- **Email sender:** App (`sendClientInviteEmail`) via Resend or Brevo (`EMAIL_PROVIDER`)
- **Redirect:** `{APP_URL}/portal/accept`
- **Metadata:** `invited_role`, `is_client`, `full_name`, `company`, `project_id`
- **`invite_token` column:** unused by current application code

---

## 12. Setup / first admin bootstrap

Page: `src/app/(auth)/setup/page.tsx` (`ROUTES.SETUP = '/setup'`)

Intended as first-time setup UI (`signUp` with `full_name` only).

**Caveats today:**

1. `/setup` is **not** in `PUBLIC_PATHS` → anonymous users never reach it (proxy → login).
2. Signup metadata does **not** set `invited_role: 'admin'` → trigger creates **`member`**.
3. Google/callback rejects non-admin users without `invited_role`.

**Practical bootstrap:** Create the first user in Supabase Dashboard and set `profiles.role = 'admin'` (or temporarily widen public paths / metadata), then use invite-only flows thereafter.

---

## 13. End-to-end flow diagrams

### Team invite → dashboard

```
Admin invites → Supabase email → /accept-invite
  → password set → profiles.role from invited_role
  → proxy ROLE_MAP → /dashboard (or allowed routes)
```

### Client invite → portal

```
Admin/Manager invites → generateLink + branded email → /portal/accept
  → password set → activate (status active)
  → proxy forces /portal/:projectId
  → portal.server uses service client for project data
```

### Google OAuth

```
Login with Google → /api/auth/callback
  → exchange code
  → client? → portal
  → invited team? → accept-invite
  → unknown? → delete / reject → not_invited
```

### Every authenticated request

```
Browser cookie → proxy refreshes session
  → profiles check (service)
  → client vs team branch
  → page permission OR API next()
  → server requireRole / requireClientSession
  → DB under RLS or service role
```

---

## 14. Known gaps and caveats

1. **`team_role` + `'client'`** — used in app/types; not added in the checked-in SQL enum migration. Live DB must have the value.
2. **`/setup`** — not public and does not create an admin.
3. **`client_accounts.invite_token`** — schema leftover; invites use Supabase `action_link`.
4. **`lib/supabase/middleware.ts`** — not wired into `proxy.ts`.
5. **Proxy uses `getSession()`**; server helpers use **`getUser()`** — intentional but worth knowing when debugging “session exists but user invalid” cases.
6. **CRM API routes** rely on server `require*` for role checks; proxy only ensures “someone is logged in” for `/api/*` (except public auth).
7. **Portal data** largely bypasses client RLS via service role — security depends on `requireClientSession` always scoping by `auth_user_id` / `project_id`.

---

## 15. File index

### Core / clients / gating

- `src/proxy.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/service.ts`
- `src/lib/supabase/middleware.ts`
- `src/server/shared/require-session.ts`
- `src/server/shared/errors.ts`
- `src/server/shared/handle-route-error.ts`
- `src/hooks/useAuth.ts`
- `src/stores/auth-store.ts`

### Constants

- `src/constants/roles.ts`
- `src/constants/routes.ts`
- `src/constants/env.ts`
- `src/constants/env.server.ts`
- `src/constants/nav.ts`
- `src/lib/project-permissions.ts`

### Auth UI

- `src/app/(auth)/layout.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/accept-invite/page.tsx`
- `src/app/(auth)/forgot-password/page.tsx`
- `src/app/(auth)/reset-password/page.tsx`
- `src/app/(auth)/setup/page.tsx`
- `src/components/ui/AuthCard.tsx`
- `src/components/ui/AuthWordmark.tsx`
- `src/components/ui/GoogleButton.tsx`

### Auth API

- `src/app/api/auth/callback/route.ts`
- `src/app/api/auth/signout/route.ts`

### Team invite / management

- `src/server/team/invite.server.ts`
- `src/server/team/team.server.ts`
- `src/app/api/team/invite/route.ts`
- `src/app/api/team/route.ts`
- `src/app/api/team/[id]/route.ts`
- `src/app/(dashboard)/team/page.tsx`

### Client invite / portal

- `src/server/projects/projects.server.ts` (`inviteClient`)
- `src/app/api/projects/[id]/invite-client/route.ts`
- `src/components/projects/InviteClientModal.tsx`
- `src/server/client-portal/portal.server.ts`
- `src/app/(client-portal)/portal/accept/page.tsx`
- `src/app/api/portal/activate/route.ts`
- `src/app/api/portal/settings/route.ts`
- `src/lib/notifications/email.ts` (`sendClientInviteEmail`)

### Settings

- `src/server/settings/settings.server.ts`
- `src/app/api/settings/password/route.ts`
- `src/app/api/settings/profile/route.ts`

### SQL migrations

- `supabase/migrations/00_core/001_extensions_and_enums.sql`
- `supabase/migrations/01_auth/001_profiles.sql`
- `supabase/migrations/01_auth/002_client_accounts.sql`
- `supabase/migrations/01_auth/003_invite_role_trigger.sql`
- `supabase/migrations/01_auth/004_avatars_bucket.sql`
- `supabase/migrations/03_projects/001_projects.sql`

### Types

- `src/types/database.types.ts`

---

*This document describes the authentication system as implemented in the Forgex CRM codebase. It is documentation only — it does not change runtime behavior.*
