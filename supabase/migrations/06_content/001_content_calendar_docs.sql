-- ============================================================
-- 06_content / 001_content_calendar_docs.sql
-- Content calendar entries + internal notes/docs (replacing Notion).
-- ============================================================

-- ============================================================
-- Content Calendar
-- ============================================================
create table content_calendar (
  id            uuid primary key default gen_random_uuid(),
  blog_post_id  uuid references blog_posts(id) on delete set null,  -- linked when post exists
  title         text not null,
  planned_date  date,
  status        calendar_status not null default 'idea',
  assigned_to   uuid references profiles(id) on delete set null,
  notes         text,
  created_by    uuid not null references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table content_calendar is 'Editorial calendar. Can be a planned idea before a blog_post exists, or linked to one.';

create trigger content_calendar_updated_at
  before update on content_calendar
  for each row execute function set_updated_at();

-- ============================================================
-- RLS: content_calendar
-- ============================================================
alter table content_calendar enable row level security;

-- All team members read
create policy "team_read_content_calendar"
  on content_calendar for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

-- Admin/manager manage all entries
create policy "admin_manager_manage_calendar"
  on content_calendar for all
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Member can create ideas
create policy "member_insert_calendar"
  on content_calendar for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid())
  );

-- ============================================================
-- Internal Docs (replacing Notion for team notes/SOPs)
-- ============================================================
create table internal_docs (
  id           uuid primary key default gen_random_uuid(),
  title        text not null,
  content      jsonb,                      -- TipTap JSON
  category     text,                       -- e.g. 'SOPs', 'Templates', 'Research', 'Meeting Notes'
  is_shared    boolean not null default true,  -- false = private to author
  author_id    uuid not null references profiles(id),
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

comment on table internal_docs is 'Internal notes and documentation. is_shared=false = private to author only.';

create trigger internal_docs_updated_at
  before update on internal_docs
  for each row execute function set_updated_at();

-- ============================================================
-- RLS: internal_docs
-- ============================================================
alter table internal_docs enable row level security;

-- Team reads shared docs
create policy "team_read_shared_docs"
  on internal_docs for select
  to authenticated
  using (
    is_shared = true
    and exists (select 1 from profiles p where p.id = auth.uid())
  );

-- Author reads own private docs
create policy "author_read_private_docs"
  on internal_docs for select
  to authenticated
  using (author_id = auth.uid());

-- Any team member can create docs
create policy "team_insert_docs"
  on internal_docs for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid())
  );

-- Author updates own docs
create policy "author_update_docs"
  on internal_docs for update
  to authenticated
  using (author_id = auth.uid());

-- Admin can update/delete any doc
create policy "admin_manage_docs"
  on internal_docs for all
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );