-- ============================================================
-- 07_notifications / 001_notifications.sql
-- In-app only notifications. No email. Ever.
-- Delivered via Supabase Realtime to the browser.
-- ============================================================

create table notifications (
  id               uuid primary key default gen_random_uuid(),

  -- Recipient (always a team member — clients have no notification system)
  user_id          uuid not null references profiles(id) on delete cascade,

  -- Content
  type             notification_type not null,
  title            text not null,
  body             text,

  -- Polymorphic link (what triggered this notification)
  reference_type   notification_reference_type,
  reference_id     uuid,                      -- e.g. lead.id, project.id, task.id

  -- State
  is_read          boolean not null default false,
  is_dismissed     boolean not null default false,

  -- Timestamps
  created_at       timestamptz not null default now(),
  read_at          timestamptz
);

comment on table notifications is 'In-app notifications only. No email. Pushed via Supabase Realtime.';
comment on column notifications.reference_type is 'What entity this notification is about (for navigation).';
comment on column notifications.reference_id is 'ID of the referenced entity (lead, project, task, etc).';

-- Index for polling unread count per user
create index notifications_user_unread_idx
  on notifications (user_id, is_read, is_dismissed)
  where is_dismissed = false;

-- Index for time-ordered list per user
create index notifications_user_created_idx
  on notifications (user_id, created_at desc);

-- ============================================================
-- RLS: notifications
-- ============================================================
alter table notifications enable row level security;

-- User reads only their own notifications
create policy "user_read_own_notifications"
  on notifications for select
  to authenticated
  using (user_id = auth.uid());

-- Service role inserts (notification fan-out via server/notifications/)
-- No direct insert from authenticated role — always goes through server function
create policy "service_insert_notifications"
  on notifications for insert
  to service_role
  with check (true);

-- User marks own as read/dismissed
create policy "user_update_own_notifications"
  on notifications for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ============================================================
-- Enable Realtime for notifications
-- (Run this separately in Supabase dashboard OR via API — 
--  cannot be done in migration SQL directly)
-- 
-- SQL to run in Supabase SQL editor after migration:
--   alter publication supabase_realtime add table notifications;
--
-- In the app, subscribe with:
--   supabase
--     .channel('notifications')
--     .on('postgres_changes', {
--       event: 'INSERT',
--       schema: 'public',
--       table: 'notifications',
--       filter: `user_id=eq.${userId}`
--     }, handleNewNotification)
--     .subscribe()
-- ============================================================

-- Helper function: create a notification (called from server functions)
-- Usage: select create_notification('user-uuid', 'task_assigned', 'New task', 'You have a new task', 'task', 'task-uuid');
create or replace function create_notification(
  p_user_id          uuid,
  p_type             notification_type,
  p_title            text,
  p_body             text default null,
  p_reference_type   notification_reference_type default null,
  p_reference_id     uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  insert into notifications (user_id, type, title, body, reference_type, reference_id)
  values (p_user_id, p_type, p_title, p_body, p_reference_type, p_reference_id)
  returning id into v_id;
  return v_id;
end;
$$;

comment on function create_notification is 'Server-side helper to insert a notification. Always use this — never write directly to notifications table from feature code.';