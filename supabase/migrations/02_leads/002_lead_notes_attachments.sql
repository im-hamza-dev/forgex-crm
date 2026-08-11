-- ============================================================
-- 02_leads / 002_lead_notes_attachments.sql
-- Conversation log: notes, meetings, calls, emails per lead.
-- Also file attachments (proposals, NDAs, contracts).
-- ============================================================

-- ============================================================
-- Lead Notes (conversation timeline)
-- ============================================================
create table lead_notes (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  content     text not null,
  note_type   lead_note_type not null default 'note',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table lead_notes is 'Conversation timeline for a lead. Internal only — never visible to clients.';

create trigger lead_notes_updated_at
  before update on lead_notes
  for each row execute function set_updated_at();

-- Auto-update last_contacted_at on lead when a note is inserted
create or replace function update_lead_last_contacted()
returns trigger
language plpgsql
as $$
begin
  update leads
  set last_contacted_at = now(), updated_at = now()
  where id = new.lead_id;
  return new;
end;
$$;

create trigger on_lead_note_inserted
  after insert on lead_notes
  for each row execute function update_lead_last_contacted();

-- ============================================================
-- RLS: lead_notes
-- ============================================================
alter table lead_notes enable row level security;

create policy "team_read_lead_notes"
  on lead_notes for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
    )
    and (
      -- admin/manager see all
      exists (
        select 1 from profiles p
        where p.id = auth.uid()
        and p.role in ('admin', 'manager')
      )
      or
      -- member sees notes on leads assigned to them
      exists (
        select 1 from leads l
        where l.id = lead_notes.lead_id
        and l.assigned_to = auth.uid()
      )
    )
  );

create policy "team_insert_lead_notes"
  on lead_notes for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
    )
  );

create policy "author_update_lead_notes"
  on lead_notes for update
  to authenticated
  using (author_id = auth.uid());

create policy "admin_manager_delete_lead_notes"
  on lead_notes for delete
  to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- ============================================================
-- Lead Attachments (files uploaded to a lead)
-- ============================================================
create table lead_attachments (
  id           uuid primary key default gen_random_uuid(),
  lead_id      uuid not null references leads(id) on delete cascade,
  note_id      uuid references lead_notes(id) on delete set null,  -- optional link to a note
  uploaded_by  uuid not null references profiles(id),
  file_url     text not null,               -- Supabase Storage URL
  file_name    text not null,
  file_size    bigint,                      -- bytes
  mime_type    text,
  created_at   timestamptz not null default now()
);

comment on table lead_attachments is 'Files attached to a lead (proposals, NDAs, contracts). Stored in Supabase Storage.';

alter table lead_attachments enable row level security;

create policy "team_read_lead_attachments"
  on lead_attachments for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
    or exists (
      select 1 from leads l
      where l.id = lead_attachments.lead_id
      and l.assigned_to = auth.uid()
    )
  );

create policy "team_insert_lead_attachments"
  on lead_attachments for insert
  to authenticated
  with check (
    uploaded_by = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid())
  );

create policy "admin_manager_delete_lead_attachments"
  on lead_attachments for delete
  to authenticated
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );