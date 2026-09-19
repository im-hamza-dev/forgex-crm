-- ============================================================
-- 09_videos / 002_video_events.sql
-- Public view/play tracking. Counters live on videos; the event
-- log holds visitor details (IP, UA, geo) for the dashboard drawer.
-- ============================================================

alter table videos
  add column if not exists view_count integer not null default 0,
  add column if not exists play_count integer not null default 0;

comment on column videos.view_count is 'Denormalized public page-load count. Incremented with each video_events view row.';
comment on column videos.play_count is 'Denormalized public play count. Incremented on every native video play event.';

create table video_events (
  id          uuid primary key default gen_random_uuid(),
  video_id    uuid not null references videos(id) on delete cascade,
  event_type  text not null check (event_type in ('view', 'play')),
  ip          text,
  user_agent  text,
  referrer    text,
  browser     text,
  os          text,
  device      text,
  country     text,
  city        text,
  created_at  timestamptz not null default now()
);

comment on table video_events is 'Append-only public share analytics. Written only via the service-role API route.';

create index video_events_video_created_idx
  on video_events (video_id, created_at desc);

create index video_events_video_type_idx
  on video_events (video_id, event_type);

-- Insert + bump in one transaction so a failed insert never inflates the counter.
create or replace function record_video_event(
  p_video_id uuid,
  p_event_type text,
  p_ip text default null,
  p_user_agent text default null,
  p_referrer text default null,
  p_browser text default null,
  p_os text default null,
  p_device text default null,
  p_country text default null,
  p_city text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_event_type not in ('view', 'play') then
    raise exception 'invalid event type';
  end if;

  insert into video_events (
    video_id, event_type, ip, user_agent, referrer,
    browser, os, device, country, city
  ) values (
    p_video_id, p_event_type, p_ip, p_user_agent, p_referrer,
    p_browser, p_os, p_device, p_country, p_city
  );

  if p_event_type = 'view' then
    update videos set view_count = view_count + 1 where id = p_video_id;
  else
    update videos set play_count = play_count + 1 where id = p_video_id;
  end if;
end;
$$;

revoke all on function record_video_event(uuid, text, text, text, text, text, text, text, text, text) from public;
grant execute on function record_video_event(uuid, text, text, text, text, text, text, text, text, text) to service_role;

-- ============================================================
-- RLS: video_events
-- ============================================================
alter table video_events enable row level security;

-- Dashboard reads. Public writes never go through this policy — they use
-- record_video_event() via the service-role client.
create policy "admin_manager_read_video_events"
  on video_events for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );
