-- ============================================================
-- 09_videos / 001_videos.sql
-- Shareable videos. Uploaded to the private `videos` bucket and
-- served on a public /v/[slug] page via per-load signed URLs.
-- ============================================================

create table videos (
  id                uuid primary key default gen_random_uuid(),
  slug              text not null unique,
  title             text not null,
  description       text,
  storage_path      text not null,
  is_public         boolean not null default true,
  duration_seconds  integer,
  file_size_bytes   bigint,
  mime_type         text,
  created_by        uuid not null references profiles(id),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  deleted_at        timestamptz
);

comment on table videos is 'Shareable video clips. Public page resolves by slug via a service-role route.';
comment on column videos.slug is 'Frozen at creation — renaming the title must not break already-shared links. Uniqued with -2/-3 suffixes.';
comment on column videos.storage_path is 'Object path inside the private `videos` bucket. Never exposed to unauthenticated clients.';
comment on column videos.is_public is 'Checked on every public page load, so flipping to false kills existing links immediately.';
comment on column videos.deleted_at is 'Soft delete. null = live. Deleted rows keep their Storage file and stay restorable.';

create index videos_slug_idx       on videos (slug) where deleted_at is null;
create index videos_created_by_idx on videos (created_by);

create trigger videos_updated_at
  before update on videos
  for each row execute function set_updated_at();

-- ============================================================
-- RLS: videos
-- ============================================================
alter table videos enable row level security;

-- Admin/manager read all live videos. No anon policy: the public page
-- reads through a service-role client, never as the visitor.
create policy "admin_manager_read_videos"
  on videos for select
  to authenticated
  using (
    deleted_at is null
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

create policy "admin_manager_insert_videos"
  on videos for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Covers edits, visibility toggles, soft delete and restore.
create policy "admin_manager_update_videos"
  on videos for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- ============================================================
-- Storage: private `videos` bucket
-- ============================================================

-- public=false is what makes "flip to private = kill immediately" possible:
-- nothing in this bucket is ever reachable through a permanent raw URL, so
-- the only way in is a short-lived signed URL minted after the is_public check.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'videos',
  'videos',
  false,
  524288000,
  array['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
)
on conflict (id) do nothing;

create policy "videos_objects_insert_admin_manager"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'videos'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );

create policy "videos_objects_select_admin_manager"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'videos'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );

-- Only used for a manual hard purge; soft delete leaves the file in place.
create policy "videos_objects_delete_admin_manager"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'videos'
    and exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('admin', 'manager')
    )
  );

-- Deliberately no anon/public select policy on storage.objects for this bucket.
-- Adding one would make every object permanently fetchable by path and defeat
-- the whole revocation model.
