-- Tasks: add review status + manager delete-own policy
-- Safe to re-run (IF NOT EXISTS / DROP IF EXISTS)

ALTER TYPE public.task_status ADD VALUE IF NOT EXISTS 'review';

DROP POLICY IF EXISTS "tasks_delete_manager_own" ON tasks;
CREATE POLICY "tasks_delete_manager_own" ON tasks
  FOR DELETE TO authenticated
  USING (
    created_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
    )
  );

DROP POLICY IF EXISTS "task_comments_delete_admin" ON task_comments;
CREATE POLICY "task_comments_delete_admin" ON task_comments
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );
