# CRM Auth Safety Audit — Phase 4 Community Users

**Date:** August 26, 2026  
**Codebase:** `forgex_crm`  
**Mode:** Audit only — no code or config changes made  
**Purpose:** Confirm whether Phase 4 community auth on `forgex.systems` (shared Supabase project) can break or compromise CRM auth

---

## STEP 1 — Files reviewed

| Path | Status |
|------|--------|
| `src/middleware.ts` | **Does not exist** |
| `src/proxy.ts` | **Active route gate** (Next.js 16 proxy; replaces middleware) |
| `src/lib/supabase/server.ts` | Cookie SSR client (anon) |
| `src/lib/supabase/client.ts` | Browser singleton (anon) |
| `src/lib/supabase/middleware.ts` | `updateSession` helper — **not wired into `proxy.ts`** |
| `src/app/api/auth/callback/route.ts` | OAuth / PKCE callback (not `src/app/auth/callback`) |
| `src/app/(auth)/login/page.tsx` | Email/password + Google OAuth |
| `src/server/shared/require-session.ts` | `getSession` / `requireSession` / `requireRole` |
| `supabase/migrations/01_auth/001_profiles.sql` | `handle_new_user` + `on_auth_user_created` |
| `supabase/migrations/01_auth/003_invite_role_trigger.sql` | Same function (replace) |

There is no classic Next `middleware.ts`. All edge protection is in **`src/proxy.ts`**.

---

## STEP 2 — Audit checklist

### A — Middleware / proxy route protection

#### A1. What routes are protected?

`proxy.ts` `config.matcher`:

```
/((?!_next/static|_next/image|favicon.ico|.*\.(?:svg|png|jpg|jpeg|gif|webp)$).*)
```

Everything is gated **except** static/image assets.

**Public (session not required):**

- `/login`, `/forgot-password`, `/reset-password`
- `/accept-invite`, `/portal/accept`
- `/privacy`
- `/manifest.json`, `/portal/manifest.webmanifest`, `/portal/manifest`
- `/sw.js`, `/google74af155327ae2e69.html`
- `/api/auth` (prefix)

All other pages and APIs require a session.

#### A2. How is “team member” verified?

Not session-only. After `getSession()`:

1. Service client loads `profiles.role, is_active` for `session.user.id`
2. **No profile** → `signOut` → `/login?error=not_invited`
3. **Inactive** → `signOut` → `/login?error=account_inactive`
4. **`role === 'client'`** → portal-only paths + `client_accounts` check
5. **Team roles** → `ROLE_MAP` / `ROUTE_PERMISSION_MAP` for CRM pages

So verification is:

- (a) Session must exist, **and**
- (b) Row must exist in **`profiles`**, **and**
- (c) Role drives portal vs CRM and page permissions

Answers: **(b) + (c)**, not (a) alone.

#### A3. CRITICAL — Community user with auth.users session visiting CRM

**Trace today:**

1. Community user signs up on `forgex.systems` → `INSERT auth.users`
2. CRM trigger `on_auth_user_created` → `handle_new_user()` runs on **every** new auth user
3. With no `invited_role`, role defaults to **`member`**
4. A **`profiles` row is created** for the community user
5. If that user obtains a CRM cookie session (login on CRM host, or shared cookies):
   - Proxy: session OK → profile found → `is_active` true → **CRM access as `member`**

**Email/password path (no callback gate):**

- Login page calls `signInWithPassword` then `window.location.href = redirectTo`
- Does **not** check `invited_role`
- Relies entirely on proxy + profiles

**Google path on CRM:**

- Goes through `/api/auth/callback`
- If profile exists but `!admin && !invited_role` → **deletes profile + auth user**
- That blocks CRM Google access but **destroys the community account** if they hit CRM Google login

**If getUser/session succeeds but profiles is null:**

- Proxy: sign out → `not_invited`
- Callback: **`auth.admin.deleteUser(user.id)`** then `not_invited` — destructive for any shared `auth.users` identity

#### A4. Redirect behaviour

| Case | Behaviour |
|------|-----------|
| No session (page) | → `/login` |
| No session (API) | `401 JSON` |
| No profile | → `/login?error=not_invited` (+ signOut) |
| Inactive | → `/login?error=account_inactive` |
| Client on CRM route | → `/portal` |
| Team on `/portal` | → `/dashboard` |
| Team lacking route permission | → `/dashboard` |

---

### B — Auth callback route

Path: **`src/app/api/auth/callback/route.ts`** (not `src/app/auth/callback`).

After `exchangeCodeForSession`:

1. Load `profiles` + `client_accounts` (by auth id / email)
2. Client path → activate / portal redirect
3. **No profile** → **delete auth user** → login `not_invited`
4. Inactive → signOut → `account_inactive`
5. Non-admin without `invited_role` → **delete profile + delete auth user** → `not_invited`
6. Team invite with `invited_role` → `/accept-invite`
7. Else → `next` or dashboard

**Does it verify profiles before dashboard?** Yes for team path.  
**Non-team hitting callback?** Rejected — and currently often **hard-deleted**, which is unsafe once community users share `auth.users`.

---

### C — Session isolation between apps

| App | Domain (from codebase / env) |
|-----|------------------------------|
| forgex_crm | Local: `NEXT_PUBLIC_APP_URL=http://localhost:3000`. Production host not committed; email fallback mentions `app.forgex.system` (likely typo for app/crm host). Repo: `im-hamza-dev/forgex-crm` |
| forgex.systems | `www.forgex.systems` / `forgex.systems` (public site) |

**Cookie behaviour (`@supabase/ssr`):**

- Cookies are typically **host-only** (no parent `Domain=.forgex.systems` in app code)
- Same Supabase project ref → same cookie **name**, but different hosts do **not** share host-only cookies by default

**Shared cookie risk:**

- **No**, if CRM is on a different host than `www.forgex.systems` (e.g. `crm.…` / `app.…` / separate Vercel URL) and cookies stay host-only
- **Yes**, if both apps are served from the same host, or cookies are ever set with `Domain=.forgex.systems`

Session validity across apps is still real at the **Supabase JWT** level: the token is valid for the project everywhere; isolation depends on cookies not being shared **and** CRM authorization not treating every profile as a team seat.

---

### D — profiles table as the team gate

#### D1–D2. Automatic vs manual profiles

**Automatic.** Trigger on `auth.users` INSERT:

```sql
-- 01_auth/001_profiles.sql
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
```

`handle_new_user()`:

- Reads `raw_user_meta_data.invited_role`
- Else defaults to **`member`**
- Inserts into `public.profiles` for **every** new auth user (`ON CONFLICT DO NOTHING`)

Profiles are **not** invite-only at the DB layer. Invites only set metadata; the trigger always inserts.

#### D3. CRITICAL — Phase 4 community signup vs CRM trigger

**Yes — the CRM trigger will also fire.**

Any Phase 4 `INSERT` into `auth.users` (Google community signup, etc.) will:

1. Run `handle_new_user()` → create **`profiles` with `role = 'member'`** (unless metadata sets another `team_role`)
2. Possibly also run a future `community_users` trigger

That is a **serious security issue**: community identities become CRM “Lead Generator” members at the database layer, and proxy treats a live `profiles` row as authorized.

---

### E — OAuth provider configuration

| Question | Finding |
|----------|---------|
| Providers in CRM code | **Google** via `signInWithOAuth({ provider: 'google' })` + email/password |
| Same Google provider for Phase 4? | Yes, if same Supabase project — provider is project-level |
| CRM callback URL | `${window.location.origin}/api/auth/callback?next=...` → e.g. `https://<crm-host>/api/auth/callback` |
| Public site callback (Phase 4) | Planned `https://www.forgex.systems/auth/callback` (or `/api/auth/callback` — must match site) |

**Conflict risk:** Low if both URLs are registered in Supabase Auth redirect allow-list and each app uses its own `redirectTo`.  
**Danger:** Same provider + same `auth.users` + CRM trigger/callback delete logic.

No email-domain allowlist found in CRM auth code.

---

### F — Email domain restriction

**None.**

- Placeholders use `@forgex.systems` in UI only
- No middleware/proxy/RLS check that email must match a domain
- Any Google account that ends up with a `profiles` row can satisfy CRM gates

Primary risk vector without domain restriction: **profiles auto-creation for all auth users**.

---

## STEP 3 — Risk matrix

### Risk 1: Community user accessing CRM routes

- **Current protection:** Proxy requires session + `profiles` row + `is_active`; role map for pages; callback has invite checks for Google on CRM
- **Is it sufficient:** **No**
- **Why:** Proxy treats any active `profiles` row as authorized. The DB trigger creates `profiles` (default `member`) for every `auth.users` insert. A community signup therefore becomes a CRM member at the data layer. Email/password login to the CRM does not re-check `invited_role`. Google-on-CRM may block access only by **deleting** the shared auth user (unsafe for community).

### Risk 2: Community user trigger creating profiles records

- **Current state:** Yes — `on_auth_user_created` → `handle_new_user()` on **all** `auth.users` inserts
- **Risk level:** **High**
- **Why:** Phase 4 community signups will automatically receive CRM `profiles` rows (typically `member`). That is the root privilege-escalation path into the CRM.

### Risk 3: Cookie session sharing between apps

- **CRM deployment domain:** Not fixed in repo; local `localhost:3000`; production likely a separate host (app/crm), not verified in code
- **forgex.systems domain:** `www.forgex.systems`
- **Shared cookie risk:** **No** (default host-only cookies on different hosts) — **conditional**
- **Why:** Different hosts do not share host-only cookies. Risk becomes Yes if same host or parent-domain cookies are configured. JWT remains valid project-wide regardless; app authz is what matters.

### Risk 4: OAuth callback URL confusion

- **CRM callback URL:** `<crm-origin>/api/auth/callback`
- **Phase 4 public site callback:** `https://www.forgex.systems/auth/callback` (as specified)
- **Conflict risk:** **No** (if both allow-listed and each app sets its own `redirectTo`)
- **Why:** Separate callback paths can coexist. Residual risk is behavioural: CRM callback **deletes** unknown users, which can wipe community accounts if someone starts Google OAuth from the CRM while logged in / linking the same Google identity.

---

## STEP 4 — FINAL VERDICT

# REQUIRES CRM CHANGES BEFORE PHASE 4

Community auth **cannot be safely added** to the shared Supabase project until the CRM stops treating every `auth.users` row as a team profile.

### What must change (and why)

1. **Change `handle_new_user()` so it does not create `profiles` for every auth user**  
   Only insert into `profiles` when metadata clearly indicates a CRM invite / team role (e.g. `invited_role` in `admin|manager|member|client`), or another explicit team flag.  
   **Why:** Without this, every community signup becomes a CRM `member`.

2. **Stop hard-deleting `auth.users` in the CRM OAuth callback for “unknown” users**  
   Prefer: sign out + redirect `not_invited`. Optionally check `community_users` and never delete those rows.  
   **Why:** Shared Google identities must not be destroyed by visiting the CRM login.

3. **(Recommended) Tighten proxy / `requireSession`**  
   Treat only explicit team roles as CRM-capable; do not fall back unknown roles to `ROLE_MAP.member`. Reject users who exist only in `community_users`.  
   **Why:** Defense in depth if a bad profile row appears.

4. **(Recommended) Confirm production cookie domains**  
   Keep CRM and public site on different hosts; do not set Supabase auth cookies on `.forgex.systems`.  
   **Why:** Prevent accidental session sharing.

5. **Phase 4 DB design**  
   Community trigger should write `community_users` only; it must not depend on or create `profiles`. Coordinate with (1).

### What is already good

- Proxy does **not** trust session alone — it requires `profiles`
- Client portal is separated via `role === 'client'` + `client_accounts`
- Team invites set `invited_role` correctly for intended CRM users
- Separate OAuth callback URLs per app are workable

---

## Appendix — Key code references

**Proxy profiles gate** (`src/proxy.ts` ~131–141):

```ts
const { data: profile } = await service
  .from('profiles')
  .select('role, is_active')
  .eq('id', session.user.id)
  .maybeSingle()

if (!profile) {
  await supabase.auth.signOut()
  return redirectWithCookies(loginErrorUrl(request, 'not_invited'), response)
}
```

**Trigger creates profiles for all auth users** (`01_auth/001_profiles.sql`):

```sql
v_role := coalesce(
  (new.raw_user_meta_data->>'invited_role')::team_role,
  'member'
);
insert into public.profiles (...) values (...);
```

**Callback deletes non-invited users** (`src/app/api/auth/callback/route.ts` ~107–131):

```ts
if (!profile) {
  await service.auth.admin.deleteUser(user.id)
  ...
}
if (!isAdmin && !hasInvitedRole) {
  await service.from('profiles').delete().eq('id', user.id)
  await service.auth.admin.deleteUser(user.id)
  ...
}
```

**Password login has no invite check** (`login/page.tsx`): `signInWithPassword` → redirect.

---

*End of audit. No code was modified.*
