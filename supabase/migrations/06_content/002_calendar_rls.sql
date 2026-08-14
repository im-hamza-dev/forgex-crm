-- Replace content_calendar RLS so admin/manager can view all,
-- insert own, update own/assigned (admin any), delete own (admin any).

DROP POLICY IF EXISTS "team_read_content_calendar" ON content_calendar;
DROP POLICY IF EXISTS "admin_manager_manage_calendar" ON content_calendar;
DROP POLICY IF EXISTS "member_insert_calendar" ON content_calendar;
DROP POLICY IF EXISTS "calendar_select" ON content_calendar;
DROP POLICY IF EXISTS "calendar_insert" ON content_calendar;
DROP POLICY IF EXISTS "calendar_update" ON content_calendar;
DROP POLICY IF EXISTS "calendar_delete" ON content_calendar;

ALTER TABLE content_calendar ENABLE ROW LEVEL SECURITY;

CREATE POLICY "calendar_select" ON content_calendar
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "calendar_insert" ON content_calendar
  FOR INSERT TO authenticated
  WITH CHECK (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin', 'manager')
    )
  );

CREATE POLICY "calendar_update" ON content_calendar
  FOR UPDATE TO authenticated
  USING (
    created_by = auth.uid() OR
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

CREATE POLICY "calendar_delete" ON content_calendar
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
