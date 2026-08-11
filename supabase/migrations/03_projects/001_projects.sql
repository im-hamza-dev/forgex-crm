-- ============================================================
-- 03_projects / 001_projects.sql
-- Project table + team members + milestones + updates + files.
-- ============================================================

-- ============================================================
-- Projects
-- ============================================================
create table projects (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  description         text,

  -- Client link (portal access)
  client_account_id   uuid references client_accounts(id) on delete set null,

  -- Classification
  service_type        service_type,
  status              project_status not null default 'discovery',
  payment_status      payment_status not null default 'pending',

  -- Financials
  fixed_price         numeric(12,2),        -- contract value
  currency            text not null default 'USD',

  -- Timeline
  start_date          date,
  deadline            date,

  -- Progress
  completion_pct      smallint not null default 0
                        check (completion_pct between 0 and 100),

  -- Visibility
  is_client_visible   boolean not null default false,  -- client portal toggle

  -- Audit
  created_by          uuid not null references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table projects is 'Each project is linked to a client. completion_pct is auto-calculated from tasks via trigger.';

create trigger projects_updated_at
  before update on projects
  for each row execute function set_updated_at();

-- Add FK from client_accounts.project_id now that projects exists
alter table client_accounts
  add constraint client_accounts_project_id_fkey
  foreign key (project_id) references projects(id) on delete cascade;

-- Add FK from leads.converted_project_id
alter table leads
  add constraint leads_converted_project_id_fkey
  foreign key (converted_project_id) references projects(id) on delete set null;

-- ============================================================
-- Project Members (team members on a project)
-- ============================================================
create table project_members (
  id          uuid primary key default gen_random_uuid(),
  project_id  uuid not null references projects(id) on delete cascade,
  user_id     uuid not null references profiles(id) on delete cascade,
  added_at    timestamptz not null default now(),
  unique (project_id, user_id)
);

comment on table project_members is 'Many-to-many: team members assigned to a project.';

-- ============================================================
-- Project Milestones
-- ============================================================
create table project_milestones (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references projects(id) on delete cascade,
  title         text not null,
  description   text,
  due_date      date,
  completed_at  timestamptz,
  created_by    uuid not null references profiles(id),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

comment on table project_milestones is 'Key delivery checkpoints within a project.';

create trigger project_milestones_updated_at
  before update on project_milestones
  for each row execute function set_updated_at();

-- ============================================================
-- Project Updates (team posts — some visible to client)
-- ============================================================
create table project_updates (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  author_id         uuid not null references profiles(id),
  content           text not null,
  is_client_visible boolean not null default false,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table project_updates is 'Team posts about project progress. is_client_visible controls portal visibility.';

create trigger project_updates_updated_at
  before update on project_updates
  for each row execute function set_updated_at();

-- ============================================================
-- Project Files (deliverables, assets shared with client)
-- ============================================================
create table project_files (
  id                uuid primary key default gen_random_uuid(),
  project_id        uuid not null references projects(id) on delete cascade,
  uploaded_by       uuid not null references profiles(id),
  file_url          text not null,
  file_name         text not null,
  file_size         bigint,
  mime_type         text,
  is_client_visible boolean not null default false,
  created_at        timestamptz not null default now()
);

comment on table project_files is 'Files attached to a project. is_client_visible controls portal access.';

-- ============================================================
-- RLS: projects
-- ============================================================
alter table projects enable row level security;

-- Team reads all projects
create policy "team_read_projects"
  on projects for select
  to authenticated
  using (
    exists (select 1 from profiles p where p.id = auth.uid())
  );

-- Admin/manager insert
create policy "admin_manager_insert_projects"
  on projects for insert
  to authenticated
  with check (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Admin/manager update
create policy "admin_manager_update_projects"
  on projects for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Admin delete
create policy "admin_delete_projects"
  on projects for delete
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- ============================================================
-- RLS: project_members, milestones, updates, files
-- ============================================================
alter table project_members enable row level security;
alter table project_milestones enable row level security;
alter table project_updates enable row level security;
alter table project_files enable row level security;

-- Team reads everything
create policy "team_read_project_members"
  on project_members for select to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

create policy "team_read_project_milestones"
  on project_milestones for select to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

create policy "team_read_project_updates"
  on project_updates for select to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

create policy "team_read_project_files"
  on project_files for select to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

-- Admin/manager manage all sub-resources
create policy "admin_manager_manage_project_members"
  on project_members for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

create policy "admin_manager_manage_milestones"
  on project_milestones for all to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

create policy "team_insert_project_updates"
  on project_updates for insert to authenticated
  with check (author_id = auth.uid());

create policy "admin_manager_update_project_updates"
  on project_updates for update to authenticated
  using (
    author_id = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

create policy "team_insert_project_files"
  on project_files for insert to authenticated
  with check (uploaded_by = auth.uid());

create policy "admin_manager_delete_project_files"
  on project_files for delete to authenticated
  using (
    uploaded_by = auth.uid()
    or exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );