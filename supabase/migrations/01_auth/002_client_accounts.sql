-- ============================================================
-- 01_auth / 002_client_accounts.sql
-- Client portal accounts. Separate from team auth.users.
-- Clients get a magic-link invite to view their project only.
-- ============================================================

create table client_accounts (
  id              uuid primary key default gen_random_uuid(),
  email           text not null,
  full_name       text not null,
  company         text,
  project_id      uuid not null,           -- FK added after 03_projects migration
  invite_token    text unique,             -- one-time magic link token
  invite_sent_at  timestamptz,
  status          client_account_status not null default 'pending',
  auth_user_id    uuid references auth.users(id) on delete set null,  -- set after they accept
  created_by      uuid not null references profiles(id),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table client_accounts is 'Portal-only access. Each client is scoped to exactly one project.';
comment on column client_accounts.invite_token is 'One-time token for magic-link portal invite. Nulled after acceptance.';

create trigger client_accounts_updated_at
  before update on client_accounts
  for each row execute function set_updated_at();

-- ============================================================
-- RLS: client_accounts
-- ============================================================
alter table client_accounts enable row level security;

-- Team (admin/manager) can read all client accounts
create policy "team_read_client_accounts"
  on client_accounts for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Admin/manager can insert client accounts
create policy "team_insert_client_accounts"
  on client_accounts for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Admin/manager can update client accounts
create policy "team_update_client_accounts"
  on client_accounts for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );