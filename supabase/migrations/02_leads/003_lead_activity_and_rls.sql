-- ============================================================
-- 02_leads / 003_lead_activity_and_rls.sql
-- Activity log + RLS updates for member create/update/own access
-- ============================================================

-- ============================================================
-- lead_activity
-- ============================================================
create table if not exists lead_activity (
  id          uuid primary key default gen_random_uuid(),
  lead_id     uuid not null references leads(id) on delete cascade,
  actor_id    uuid references profiles(id) on delete set null,
  actor_name  text not null,
  action      text not null,
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

comment on table lead_activity is 'Audit trail of lead actions (stage moves, notes, assignments, etc).';

create index if not exists lead_activity_lead_id_idx on lead_activity (lead_id, created_at desc);

alter table lead_activity enable row level security;

create policy "lead_activity_select"
  on lead_activity for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
    or exists (
      select 1 from leads l
      where l.id = lead_activity.lead_id
      and (l.assigned_to = auth.uid() or l.created_by = auth.uid())
    )
  );

create policy "lead_activity_insert"
  on lead_activity for insert
  to authenticated
  with check (actor_id = auth.uid());

-- ============================================================
-- leads RLS — replace policies to match role matrix
-- ============================================================
drop policy if exists "admin_manager_read_all_leads" on leads;
drop policy if exists "member_read_assigned_leads" on leads;
drop policy if exists "admin_manager_insert_leads" on leads;
drop policy if exists "admin_manager_update_leads" on leads;
drop policy if exists "admin_delete_leads" on leads;

create policy "leads_select_admin_manager"
  on leads for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

create policy "leads_select_member"
  on leads for select
  to authenticated
  using (
    assigned_to = auth.uid() or created_by = auth.uid()
  );

create policy "leads_insert"
  on leads for insert
  to authenticated
  with check (created_by = auth.uid());

create policy "leads_update_admin_manager"
  on leads for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

create policy "leads_update_member_own"
  on leads for update
  to authenticated
  using (
    assigned_to = auth.uid() or created_by = auth.uid()
  );

create policy "leads_delete_admin"
  on leads for delete
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

create policy "leads_delete_manager_own"
  on leads for delete
  to authenticated
  using (
    created_by = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'manager'
    )
  );

-- ============================================================
-- lead_notes — allow authors to delete own notes
-- ============================================================
drop policy if exists "admin_manager_delete_lead_notes" on lead_notes;

create policy "lead_notes_delete_own"
  on lead_notes for delete
  to authenticated
  using (author_id = auth.uid());

create policy "lead_notes_delete_admin"
  on lead_notes for delete
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- ============================================================
-- lead_attachments — allow uploader delete + admin/manager
-- ============================================================
drop policy if exists "admin_manager_delete_lead_attachments" on lead_attachments;

create policy "lead_attachments_delete_own"
  on lead_attachments for delete
  to authenticated
  using (uploaded_by = auth.uid());

create policy "lead_attachments_delete_admin_manager"
  on lead_attachments for delete
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Allow authenticated users to upload
CREATE POLICY "authenticated users can upload lead attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'lead-attachments');

-- Allow authenticated users to read
CREATE POLICY "authenticated users can read lead attachments"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'lead-attachments');

-- Allow users to delete their own uploads
CREATE POLICY "users can delete own lead attachments"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'lead-attachments' AND auth.uid()::text = (storage.foldername(name))[1]);