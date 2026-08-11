-- ============================================================
-- 10_indexes / 001_indexes.sql
-- All performance indexes across the schema.
-- Run after all tables are created.
-- FIX: FTS indexes use immutable function wrapper pattern
-- ============================================================

-- ============================================================
-- Leads
-- ============================================================
create index leads_assigned_to_idx         on leads (assigned_to)       where status = 'active';
create index leads_stage_idx               on leads (stage, status);
create index leads_next_follow_up_idx      on leads (next_follow_up)    where status = 'active' and next_follow_up is not null;
create index leads_created_at_idx          on leads (created_at desc);
create index leads_tags_gin_idx            on leads using gin (tags);
create index leads_email_idx               on leads (email)             where email is not null;

-- Full-text search on leads
-- Postgres requires index expressions to be IMMUTABLE.
-- to_tsvector() with coalesce() is not considered immutable inline,
-- so we wrap it in an IMMUTABLE sql function first.
create or replace function leads_fts_vector(
  contact_name text,
  company      text,
  email        text
)
returns tsvector
language sql
immutable
parallel safe
as $$
  select to_tsvector(
    'english',
    contact_name || ' ' ||
    coalesce(company, '') || ' ' ||
    coalesce(email, '')
  )
$$;

create index leads_fts_idx
  on leads using gin (leads_fts_vector(contact_name, company, email));

-- ============================================================
-- Lead Notes
-- ============================================================
create index lead_notes_lead_id_idx        on lead_notes (lead_id, created_at desc);
create index lead_notes_author_id_idx      on lead_notes (author_id);

-- ============================================================
-- Lead Attachments
-- ============================================================
create index lead_attachments_lead_id_idx  on lead_attachments (lead_id);

-- ============================================================
-- Projects
-- ============================================================
create index projects_status_idx           on projects (status);
create index projects_client_account_idx   on projects (client_account_id) where client_account_id is not null;
create index projects_deadline_idx         on projects (deadline)          where deadline is not null;
create index projects_created_at_idx       on projects (created_at desc);

-- ============================================================
-- Project sub-resources
-- ============================================================
create index project_members_project_idx   on project_members (project_id);
create index project_members_user_idx      on project_members (user_id);
create index project_milestones_proj_idx   on project_milestones (project_id, due_date);
create index project_updates_proj_idx      on project_updates (project_id, created_at desc);
create index project_files_proj_idx        on project_files (project_id);

-- ============================================================
-- Tasks
-- ============================================================
create index tasks_project_id_idx          on tasks (project_id, status) where project_id is not null;
create index tasks_assigned_to_idx         on tasks (assigned_to, status) where assigned_to is not null;
create index tasks_due_date_idx            on tasks (due_date)            where due_date is not null and status <> 'done';
create index tasks_parent_task_idx         on tasks (parent_task_id)      where parent_task_id is not null;
create index tasks_created_by_idx          on tasks (created_by);

-- ============================================================
-- Blog Posts
-- ============================================================
create index blog_posts_slug_idx           on blog_posts (slug);
create index blog_posts_status_idx         on blog_posts (status, publish_date desc);
create index blog_posts_author_idx         on blog_posts (author_id);
create index blog_posts_category_idx       on blog_posts (category_id)    where category_id is not null;
create index blog_posts_tags_gin_idx       on blog_posts using gin (tags);
create index blog_posts_featured_idx       on blog_posts (is_featured)    where is_featured = true;

-- Full-text search on blog posts
create or replace function blog_posts_fts_vector(
  title   text,
  excerpt text,
  tags    text[]
)
returns tsvector
language sql
immutable
parallel safe
as $$
  select to_tsvector(
    'english',
    title || ' ' ||
    coalesce(excerpt, '') || ' ' ||
    coalesce(array_to_string(tags, ' '), '')
  )
$$;

create index blog_posts_fts_idx
  on blog_posts using gin (blog_posts_fts_vector(title, excerpt, tags));

-- ============================================================
-- Blog Comments
-- ============================================================
create index blog_comments_post_idx        on blog_comments (post_id, status, created_at);
create index blog_comments_parent_idx      on blog_comments (parent_comment_id) where parent_comment_id is not null;
create index blog_comments_pending_idx     on blog_comments (status)            where status = 'pending';

-- ============================================================
-- Content Calendar
-- ============================================================
create index content_calendar_date_idx     on content_calendar (planned_date, status);
create index content_calendar_assigned_idx on content_calendar (assigned_to)  where assigned_to is not null;

-- ============================================================
-- Internal Docs
-- ============================================================
create index internal_docs_author_idx      on internal_docs (author_id);
create index internal_docs_category_idx    on internal_docs (category)    where category is not null;
create index internal_docs_shared_idx      on internal_docs (is_shared, updated_at desc);

-- Full-text search on internal docs
create or replace function internal_docs_fts_vector(
  title    text,
  category text
)
returns tsvector
language sql
immutable
parallel safe
as $$
  select to_tsvector(
    'english',
    title || ' ' || coalesce(category, '')
  )
$$;

create index internal_docs_fts_idx
  on internal_docs using gin (internal_docs_fts_vector(title, category));

-- ============================================================
-- Client Accounts
-- ============================================================
create index client_accounts_project_idx   on client_accounts (project_id);
create index client_accounts_email_idx     on client_accounts (email);
create index client_accounts_token_idx     on client_accounts (invite_token) where invite_token is not null;

-- ============================================================
-- Client Tickets
-- ============================================================
create index client_tickets_project_idx    on client_tickets (project_id, status);
create index client_tickets_client_idx     on client_tickets (client_account_id);
create index client_tickets_open_idx       on client_tickets (status)         where status in ('open', 'in_progress');

-- ============================================================
-- Ticket Messages
-- ============================================================
create index ticket_messages_ticket_idx    on client_ticket_messages (ticket_id, created_at);

-- ============================================================
-- Notifications
-- notifications_user_unread_idx  → (user_id, is_read, is_dismissed) where not dismissed
-- notifications_user_created_idx → (user_id, created_at desc)
-- Both already created in 07_notifications/001_notifications.sql
-- ============================================================