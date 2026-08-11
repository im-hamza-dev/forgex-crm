-- ============================================================
-- 05_blog / 001_blog.sql
-- Blog system. Data lives in Supabase.
-- forgex.systems pulls from here via API.
-- CRM manages drafts, review, scheduling, publishing.
-- ============================================================

-- ============================================================
-- Blog Categories
-- ============================================================
create table blog_categories (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  description  text,
  created_at   timestamptz not null default now()
);

comment on table blog_categories is 'Blog categories. slug is used in URLs on forgex.systems.';

-- Seed default categories
insert into blog_categories (name, slug, description) values
  ('AI & Automation',  'ai-automation',  'Articles about AI agents, automation, and intelligent systems'),
  ('SaaS Development', 'saas-dev',       'Building scalable SaaS products and MVPs'),
  ('CRM & Sales',      'crm-sales',      'CRM systems, sales processes, and client management'),
  ('Case Studies',     'case-studies',   'Real projects we''ve shipped and what we learned'),
  ('Engineering',      'engineering',    'Technical deep-dives, architecture, and code'),
  ('Business',         'business',       'Strategy, growth, and running an agency');

-- ============================================================
-- Blog Posts
-- ============================================================
create table blog_posts (
  id                    uuid primary key default gen_random_uuid(),

  -- Content
  title                 text not null,
  slug                  text not null unique,
  excerpt               text,                          -- 150-160 chars for meta description
  body                  jsonb,                         -- TipTap JSON
  cover_image_url       text,

  -- Authorship
  author_id             uuid not null references profiles(id),

  -- Taxonomy
  category_id           uuid references blog_categories(id) on delete set null,
  tags                  text[] not null default '{}',

  -- Status & scheduling
  status                blog_post_status not null default 'draft',
  publish_date          timestamptz,                   -- future = scheduled
  published_at          timestamptz,                   -- set when actually published

  -- SEO fields
  seo_title             text,                          -- overrides title in <title> tag
  seo_description       text,                          -- overrides excerpt in meta description
  canonical_url         text,                          -- for cross-posting canonical
  og_image_url          text,                          -- defaults to cover_image_url if null
  reading_time_minutes  smallint,                      -- auto-calculated on save

  -- Features
  is_featured           boolean not null default false,
  allow_comments        boolean not null default true,
  is_community_post     boolean not null default false, -- submitted by visitor (Phase 2)
  community_author_id   uuid,                           -- FK added after community_users table

  -- Metrics (updated from public site analytics — future)
  view_count            bigint not null default 0,

  -- Timestamps
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table blog_posts is 'Blog post data. Pulled by forgex.systems via Supabase anon key (published only).';
comment on column blog_posts.body is 'TipTap editor JSON document.';
comment on column blog_posts.canonical_url is 'Set this if cross-posting to Medium/DEV.to to avoid duplicate content.';
comment on column blog_posts.is_community_post is 'Phase 2: visitor-submitted posts go through moderation queue.';

create trigger blog_posts_updated_at
  before update on blog_posts
  for each row execute function set_updated_at();

-- Auto-set published_at when status changes to 'published'
create or replace function set_blog_published_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'published' and (old.status is null or old.status <> 'published') then
    new.published_at = coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger blog_post_published
  before update on blog_posts
  for each row execute function set_blog_published_at();

-- ============================================================
-- Community Users (visitor accounts for comments + Phase 2 posts)
-- ============================================================
create table community_users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  display_name  text not null,
  avatar_url    text,
  bio           text,
  auth_user_id  uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table community_users is 'Visitor-facing accounts for blog comments and future community posts.';

create trigger community_users_updated_at
  before update on community_users
  for each row execute function set_updated_at();

-- Add FK from blog_posts.community_author_id now that community_users exists
alter table blog_posts
  add constraint blog_posts_community_author_id_fkey
  foreign key (community_author_id) references community_users(id) on delete set null;

-- ============================================================
-- Blog Comments (Phase 1: visitor comments with moderation)
-- ============================================================
create table blog_comments (
  id                  uuid primary key default gen_random_uuid(),
  post_id             uuid not null references blog_posts(id) on delete cascade,

  -- Author: either a community_user or a team member, not both
  community_user_id   uuid references community_users(id) on delete cascade,
  team_user_id        uuid references profiles(id) on delete cascade,

  -- Threading
  parent_comment_id   uuid references blog_comments(id) on delete cascade,

  -- Content
  content             text not null,

  -- Moderation
  status              blog_comment_status not null default 'pending',
  reviewed_by         uuid references profiles(id) on delete set null,
  reviewed_at         timestamptz,
  rejection_reason    text,

  -- Timestamps
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),

  -- Constraint: must have exactly one author
  constraint one_comment_author check (
    (community_user_id is not null)::int + (team_user_id is not null)::int = 1
  )
);

comment on table blog_comments is 'Visitor comments on blog posts. All go through moderation queue (status=pending) before showing.';
comment on column blog_comments.parent_comment_id is 'Null = top-level comment. Non-null = reply.';

create trigger blog_comments_updated_at
  before update on blog_comments
  for each row execute function set_updated_at();

-- ============================================================
-- RLS: blog_posts
-- ============================================================
alter table blog_posts enable row level security;

-- Public read: only published posts (for forgex.systems via anon key)
create policy "public_read_published_posts"
  on blog_posts for select
  to anon
  using (status = 'published');

-- Team reads all posts
create policy "team_read_all_posts"
  on blog_posts for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

-- Admin/manager insert posts
create policy "admin_manager_insert_posts"
  on blog_posts for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Member can insert draft posts
create policy "member_insert_draft_posts"
  on blog_posts for insert
  to authenticated
  with check (
    status = 'draft'
    and author_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'member'
    )
  );

-- Admin/manager can update any post
create policy "admin_manager_update_posts"
  on blog_posts for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Author can update their own draft
create policy "author_update_own_draft"
  on blog_posts for update
  to authenticated
  using (
    author_id = auth.uid()
    and status = 'draft'
  );

-- Admin delete
create policy "admin_delete_posts"
  on blog_posts for delete
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- ============================================================
-- RLS: blog_categories
-- ============================================================
alter table blog_categories enable row level security;

create policy "public_read_categories"
  on blog_categories for select
  to anon using (true);

create policy "team_read_categories"
  on blog_categories for select
  to authenticated using (true);

create policy "admin_manage_categories"
  on blog_categories for all
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- ============================================================
-- RLS: blog_comments
-- ============================================================
alter table blog_comments enable row level security;

-- Public reads only approved comments
create policy "public_read_approved_comments"
  on blog_comments for select
  to anon
  using (status = 'approved');

-- Team reads all comments (moderation)
create policy "team_read_all_comments"
  on blog_comments for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

-- Team members can insert comments (team_user_id must = auth.uid())
create policy "team_insert_comments"
  on blog_comments for insert
  to authenticated
  with check (team_user_id = auth.uid());

-- Admin/manager moderate comments
create policy "admin_manager_moderate_comments"
  on blog_comments for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- ============================================================
-- RLS: community_users
-- ============================================================
alter table community_users enable row level security;

create policy "team_read_community_users"
  on community_users for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

-- Community user reads/updates their own profile (via auth_user_id)
create policy "community_user_own_profile"
  on community_users for all
  to authenticated
  using (auth_user_id = auth.uid());