-- ============================================================
-- 01_auth / 001_profiles.sql
-- Team member profiles. One row per authenticated user.
-- Mirrors auth.users — created by trigger on signup.
-- ============================================================

create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  email         text not null,
  full_name     text,
  avatar_url    text,
  role          team_role not null default 'member',
  is_active     boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table profiles is 'One row per team member. Role controls access to CRM features.';
comment on column profiles.role is 'admin = full access; manager = leads+projects+blog; member = own tasks only';

-- Auto-create profile on auth.users insert
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- updated_at auto-update trigger
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function set_updated_at();

-- ============================================================
-- RLS: profiles
-- ============================================================
alter table profiles enable row level security;

-- Team members can read all profiles (needed for assignee dropdowns)
create policy "team_read_all_profiles"
  on profiles for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.is_active = true
    )
  );

-- Users can update their own profile
create policy "own_profile_update"
  on profiles for update
  to authenticated
  using (id = auth.uid())
  with check (id = auth.uid());

-- Only admins can update role or is_active of others
create policy "admin_update_profiles"
  on profiles for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );