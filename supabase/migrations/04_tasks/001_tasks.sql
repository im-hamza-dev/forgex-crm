-- ============================================================
-- 04_tasks / 001_tasks.sql
-- Tasks (project tasks + standalone personal tasks).
-- Supports sub-tasks via parent_task_id.
-- ============================================================

create table tasks (
  id              uuid primary key default gen_random_uuid(),

  -- Scope (project optional — null = personal/team task)
  project_id      uuid references projects(id) on delete cascade,
  milestone_id    uuid references project_milestones(id) on delete set null,

  -- Content
  title           text not null,
  description     text,

  -- Assignment
  assigned_to     uuid references profiles(id) on delete set null,
  created_by      uuid not null references profiles(id),

  -- Status
  status          task_status not null default 'todo',
  priority        task_priority not null default 'medium',

  -- Timeline
  due_date        date,
  estimated_hours numeric(5,2),
  actual_hours    numeric(5,2),

  -- Hierarchy
  parent_task_id  uuid references tasks(id) on delete cascade,

  -- Timestamps
  completed_at    timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table tasks is 'Tasks scoped to a project or standalone. Hierarchical via parent_task_id.';
comment on column tasks.project_id is 'Null = personal/team task not tied to a project.';

create trigger tasks_updated_at
  before update on tasks
  for each row execute function set_updated_at();

-- Auto-set completed_at when status changes to done
create or replace function set_task_completed_at()
returns trigger
language plpgsql
as $$
begin
  if new.status = 'done' and old.status <> 'done' then
    new.completed_at = now();
  elsif new.status <> 'done' and old.status = 'done' then
    new.completed_at = null;
  end if;
  return new;
end;
$$;

create trigger task_status_changed
  before update on tasks
  for each row execute function set_task_completed_at();

-- Auto-recalculate project completion_pct when task status changes
create or replace function recalculate_project_completion()
returns trigger
language plpgsql
as $$
declare
  v_project_id  uuid;
  v_total       int;
  v_done        int;
  v_pct         int;
begin
  -- Get project_id from old or new row
  v_project_id := coalesce(new.project_id, old.project_id);
  if v_project_id is null then
    return coalesce(new, old);
  end if;

  select
    count(*),
    count(*) filter (where status = 'done')
  into v_total, v_done
  from tasks
  where project_id = v_project_id
    and parent_task_id is null;  -- only top-level tasks for pct calc

  if v_total = 0 then
    v_pct := 0;
  else
    v_pct := round((v_done::numeric / v_total) * 100);
  end if;

  update projects
  set completion_pct = v_pct, updated_at = now()
  where id = v_project_id;

  return coalesce(new, old);
end;
$$;

create trigger task_completion_changed
  after insert or update or delete on tasks
  for each row execute function recalculate_project_completion();

-- ============================================================
-- Task Comments (internal, team-facing only)
-- ============================================================
create table task_comments (
  id          uuid primary key default gen_random_uuid(),
  task_id     uuid not null references tasks(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  content     text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table task_comments is 'Internal team discussion on a task. Never visible to clients.';

create trigger task_comments_updated_at
  before update on task_comments
  for each row execute function set_updated_at();

-- ============================================================
-- RLS: tasks
-- ============================================================
alter table tasks enable row level security;

-- Admin/manager read all tasks
create policy "admin_manager_read_all_tasks"
  on tasks for select
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

-- Member reads tasks assigned to them or created by them
create policy "member_read_own_tasks"
  on tasks for select
  to authenticated
  using (
    (assigned_to = auth.uid() or created_by = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'member'
    )
  );

-- All team members can create tasks
create policy "team_insert_tasks"
  on tasks for insert
  to authenticated
  with check (
    created_by = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid())
  );

-- Admin/manager update any task; member updates only own
create policy "admin_manager_update_tasks"
  on tasks for update
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role in ('admin', 'manager')
    )
  );

create policy "member_update_own_tasks"
  on tasks for update
  to authenticated
  using (
    (assigned_to = auth.uid() or created_by = auth.uid())
    and exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'member'
    )
  );

-- Admin deletes tasks
create policy "admin_delete_tasks"
  on tasks for delete
  to authenticated
  using (
    exists (
      select 1 from profiles p
      where p.id = auth.uid()
      and p.role = 'admin'
    )
  );

-- ============================================================
-- RLS: task_comments
-- ============================================================
alter table task_comments enable row level security;

create policy "team_read_task_comments"
  on task_comments for select
  to authenticated
  using (exists (select 1 from profiles p where p.id = auth.uid()));

create policy "team_insert_task_comments"
  on task_comments for insert
  to authenticated
  with check (
    author_id = auth.uid()
    and exists (select 1 from profiles p where p.id = auth.uid())
  );

create policy "author_manage_task_comments"
  on task_comments for all
  to authenticated
  using (author_id = auth.uid());