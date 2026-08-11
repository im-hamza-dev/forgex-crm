-- ============================================================
-- 02_leads / 001_leads.sql
-- Core lead table. Central to CRM pipeline.
-- ============================================================

create table leads (
  id               uuid primary key default gen_random_uuid(),

  -- Contact info
  contact_name     text not null,
  company          text,
  email            text,
  phone            text,
  linkedin_url     text,

  -- Classification
  source           lead_source not null default 'other',
  service_interest service_type,
  budget_range     text,                   -- e.g. "$5k-$10k", ">$20k"
  tags             text[] not null default '{}',

  -- Pipeline
  stage            lead_stage not null default 'new_lead',
  status           lead_status not null default 'active',
  priority         lead_priority not null default 'warm',
  lead_score       smallint check (lead_score between 1 and 10),

  -- Ownership
  assigned_to      uuid references profiles(id) on delete set null,
  created_by       uuid not null references profiles(id),

  -- Follow-up
  last_contacted_at  timestamptz,
  next_follow_up     date,

  -- Conversion
  converted_project_id  uuid,             -- FK added after 03_projects migration

  -- Timestamps
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

comment on table leads is 'Core CRM lead pipeline. Each lead tracks contact, stage, and conversation history.';
comment on column leads.converted_project_id is 'Set when lead is converted to a project. Keeps full history.';
comment on column leads.lead_score is '1 (cold) to 10 (hot) — manual or future auto-calculated.';

create trigger leads_updated_at
  before update on leads
  for each row execute function set_updated_at();

-- ============================================================
-- RLS: leads
-- ============================================================
alter table leads enable row level security;

-- Admin and manager see all leads
create policy "admin_manager_read_all_leads"
  on leads for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Member sees only leads assigned to them
create policy "member_read_assigned_leads"
  on leads for select
  to authenticated
  using (
    assigned_to = auth.uid()
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'member'
    )
  );

-- Admin and manager can insert leads
create policy "admin_manager_insert_leads"
  on leads for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Admin and manager can update any lead
create policy "admin_manager_update_leads"
  on leads for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Only admin can delete (soft delete via status = 'archived' preferred)
create policy "admin_delete_leads"
  on leads for delete
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );