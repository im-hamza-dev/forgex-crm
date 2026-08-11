-- ============================================================
-- 08_portal / 001_tickets.sql
-- Client-facing support/request tickets within the portal.
-- Clients raise tickets; team responds. Both can message.
-- ============================================================

create table client_tickets (
  id                uuid primary key default gen_random_uuid(),
  client_account_id uuid not null references client_accounts(id) on delete cascade,
  project_id        uuid not null references projects(id) on delete cascade,
  subject           text not null,
  status            ticket_status not null default 'open',
  priority          ticket_priority not null default 'medium',
  resolved_by       uuid references profiles(id) on delete set null,
  resolved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table client_tickets is 'Tickets raised by clients through the portal. Scoped to their project.';

create trigger client_tickets_updated_at
  before update on client_tickets
  for each row execute function set_updated_at();

-- Auto-set resolved_at when status = resolved
create or replace function set_ticket_resolved_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'resolved' and (old.status is null or old.status <> 'resolved') then
    new.resolved_at = now();
  end if;
  return new;
end;
$$;

create trigger ticket_status_changed
  before update on client_tickets
  for each row execute function set_ticket_resolved_at();

-- ============================================================
-- Ticket Messages (the conversation thread)
-- ============================================================
create table client_ticket_messages (
  id                uuid primary key default gen_random_uuid(),
  ticket_id         uuid not null references client_tickets(id) on delete cascade,

  -- Sender: either a team member or a client account
  sender_type       ticket_sender_type not null,
  team_sender_id    uuid references profiles(id) on delete set null,
  client_sender_id  uuid references client_accounts(id) on delete set null,

  content           text not null,
  created_at        timestamptz not null default now(),

  -- Constraint: must have exactly one sender
  constraint one_ticket_sender check (
    (team_sender_id is not null)::int + (client_sender_id is not null)::int = 1
  )
);

comment on table client_ticket_messages is 'Messages in a ticket thread. Sender is either team member or client.';

-- ============================================================
-- RLS: client_tickets
-- (Client portal uses service role for now — RLS here is for team access)
-- ============================================================
alter table client_tickets enable row level security;

-- Team reads all tickets
create policy "team_read_all_tickets"
  on client_tickets for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

-- Admin/manager update ticket status
create policy "admin_manager_update_tickets"
  on client_tickets for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Service role inserts tickets (client portal uses service client)
create policy "service_insert_tickets"
  on client_tickets for insert
  to service_role
  with check (true);

-- ============================================================
-- RLS: client_ticket_messages
-- ============================================================
alter table client_ticket_messages enable row level security;

-- Team reads all messages
create policy "team_read_ticket_messages"
  on client_ticket_messages for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

-- Team members can insert messages (as team sender)
create policy "team_insert_ticket_messages"
  on client_ticket_messages for insert
  to authenticated
  with check (
    sender_type = 'team'
    and team_sender_id = auth.uid()
  );

-- Service role inserts client messages (portal)
create policy "service_insert_ticket_messages"
  on client_ticket_messages for insert
  to service_role
  with check (true);

create policy "service_read_ticket_messages"
  on client_ticket_messages for select
  to service_role
  using (true);

create policy "service_read_tickets"
  on client_tickets for select
  to service_role
  using (true);