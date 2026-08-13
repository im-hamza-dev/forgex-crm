-- Projects feature RLS (run in Supabase SQL editor)
-- Also create public Storage bucket: project-files

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_milestones ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_ticket_messages ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running (optional safety)
DO $$ BEGIN
  -- no-op if missing
END $$;

CREATE POLICY "projects_select" ON projects
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "projects_insert" ON projects
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "projects_update" ON projects
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "projects_delete" ON projects
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "project_members_select" ON project_members
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "project_members_insert" ON project_members
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "project_members_delete" ON project_members
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "milestones_select" ON project_milestones
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "milestones_insert" ON project_milestones
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "milestones_update" ON project_milestones
  FOR UPDATE TO authenticated
  USING (true);

CREATE POLICY "milestones_delete" ON project_milestones
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "updates_select" ON project_updates
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "updates_insert" ON project_updates
  FOR INSERT TO authenticated
  WITH CHECK (author_id = auth.uid());

CREATE POLICY "updates_update" ON project_updates
  FOR UPDATE TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "updates_delete" ON project_updates
  FOR DELETE TO authenticated
  USING (
    author_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "files_select" ON project_files
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "files_insert" ON project_files
  FOR INSERT TO authenticated
  WITH CHECK (uploaded_by = auth.uid());

CREATE POLICY "files_update" ON project_files
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "files_delete" ON project_files
  FOR DELETE TO authenticated
  USING (
    uploaded_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "tickets_select" ON client_tickets
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "tickets_update" ON client_tickets
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "ticket_messages_select" ON client_ticket_messages
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "ticket_messages_insert" ON client_ticket_messages
  FOR INSERT TO authenticated
  WITH CHECK (team_sender_id = auth.uid());
