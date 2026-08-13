-- ============================================================
-- 01_auth / 003_invite_role_trigger.sql
-- Prefer invited_role from user metadata when creating profiles.
-- Run in SQL Editor if 001_profiles was already applied.
-- ============================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role team_role;
begin
  v_role := coalesce(
    (new.raw_user_meta_data->>'invited_role')::team_role,
    'member'
  );

  insert into public.profiles (id, email, full_name, avatar_url, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url',
    v_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;
