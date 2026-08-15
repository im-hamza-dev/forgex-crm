-- ============================================================
-- 07_notifications / 002_notifications_enhanced.sql
-- Extends notifications for in-app + email delivery.
-- Safe to run on existing schema — all changes are additive.
-- ============================================================

-- ============================================================
-- 1. Extend notification_type enum with missing values
-- ============================================================
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'lead_note_added';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'lead_stage_changed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_completed';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_comment_added';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_due_soon';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'task_overdue';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'project_member_added';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'milestone_due_soon';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'calendar_assigned';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'calendar_due_today';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'blog_post_published';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'client_doc_sent';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'team_member_joined';
ALTER TYPE notification_type ADD VALUE IF NOT EXISTS 'ticket_opened';

-- ============================================================
-- 2. Extend notification_reference_type enum
-- ============================================================
ALTER TYPE notification_reference_type ADD VALUE IF NOT EXISTS 'calendar';
ALTER TYPE notification_reference_type ADD VALUE IF NOT EXISTS 'client_document';

-- ============================================================
-- 3. Add new columns to notifications table
-- ============================================================
ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS actor_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS actor_name text;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}';

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS email_sent boolean NOT NULL DEFAULT false;

ALTER TABLE notifications
  ADD COLUMN IF NOT EXISTS email_sent_at timestamptz;

-- ============================================================
-- 4. Update create_notification helper function
-- ============================================================
CREATE OR REPLACE FUNCTION create_notification(
  p_user_id          uuid,
  p_type             notification_type,
  p_title            text,
  p_body             text DEFAULT NULL,
  p_reference_type   notification_reference_type DEFAULT NULL,
  p_reference_id     uuid DEFAULT NULL,
  p_actor_id         uuid DEFAULT NULL,
  p_actor_name       text DEFAULT NULL,
  p_metadata         jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  -- Skip self-notifications
  IF p_actor_id IS NOT NULL AND p_actor_id = p_user_id THEN
    RETURN NULL;
  END IF;

  INSERT INTO notifications (
    user_id, type, title, body,
    reference_type, reference_id,
    actor_id, actor_name, metadata
  )
  VALUES (
    p_user_id, p_type, p_title, p_body,
    p_reference_type, p_reference_id,
    p_actor_id, p_actor_name, p_metadata
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

-- ============================================================
-- 5. Dedup helper — prevents duplicate due-soon notifications
-- ============================================================
CREATE OR REPLACE FUNCTION notification_already_sent(
  p_user_id        uuid,
  p_type           notification_type,
  p_reference_id   uuid
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM notifications
    WHERE user_id = p_user_id
      AND type = p_type
      AND reference_id = p_reference_id
      AND created_at > now() - interval '24 hours'
  );
$$;

-- ============================================================
-- 6. Due-date reminder function (called by pg_cron)
-- ============================================================
CREATE OR REPLACE FUNCTION process_due_date_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  r RECORD;
BEGIN

  -- Tasks due tomorrow
  FOR r IN
    SELECT t.id, t.title, t.assigned_to
    FROM tasks t
    WHERE t.assigned_to IS NOT NULL
      AND t.status != 'done'
      AND t.due_date = CURRENT_DATE + 1
  LOOP
    IF NOT notification_already_sent(r.assigned_to, 'task_due_soon', r.id) THEN
      PERFORM create_notification(
        r.assigned_to,
        'task_due_soon',
        'Task due tomorrow',
        '"' || r.title || '" is due tomorrow',
        'task',
        r.id,
        NULL,
        NULL,
        jsonb_build_object('task_title', r.title)
      );
    END IF;
  END LOOP;

  -- Tasks overdue
  FOR r IN
    SELECT t.id, t.title, t.assigned_to, t.due_date
    FROM tasks t
    WHERE t.assigned_to IS NOT NULL
      AND t.status != 'done'
      AND t.due_date < CURRENT_DATE
  LOOP
    IF NOT notification_already_sent(r.assigned_to, 'task_overdue', r.id) THEN
      PERFORM create_notification(
        r.assigned_to,
        'task_overdue',
        'Task is overdue',
        '"' || r.title || '" was due on ' || r.due_date::text,
        'task',
        r.id,
        NULL,
        NULL,
        jsonb_build_object('task_title', r.title, 'due_date', r.due_date::text)
      );
    END IF;
  END LOOP;

  -- Milestones due tomorrow — notify all project members
  FOR r IN
    SELECT m.id, m.title, m.due_date, pm.user_id
    FROM project_milestones m
    JOIN project_members pm ON pm.project_id = m.project_id
    WHERE m.completed_at IS NULL
      AND m.due_date = CURRENT_DATE + 1
  LOOP
    IF NOT notification_already_sent(r.user_id, 'milestone_due_soon', r.id) THEN
      PERFORM create_notification(
        r.user_id,
        'milestone_due_soon',
        'Milestone due tomorrow',
        '"' || r.title || '" is due tomorrow',
        'milestone',
        r.id,
        NULL,
        NULL,
        jsonb_build_object('milestone_title', r.title)
      );
    END IF;
  END LOOP;

  -- Lead follow-ups due today
  FOR r IN
    SELECT l.id, l.contact_name, l.assigned_to
    FROM leads l
    WHERE l.assigned_to IS NOT NULL
      AND l.status = 'active'
      AND l.next_follow_up = CURRENT_DATE
  LOOP
    IF NOT notification_already_sent(r.assigned_to, 'follow_up_due', r.id) THEN
      PERFORM create_notification(
        r.assigned_to,
        'follow_up_due',
        'Follow-up due today',
        'Follow up with ' || r.contact_name || ' today',
        'lead',
        r.id,
        NULL,
        NULL,
        jsonb_build_object('contact_name', r.contact_name)
      );
    END IF;
  END LOOP;

  -- Manual calendar entries due today
  FOR r IN
    SELECT c.id, c.title, c.assigned_to
    FROM content_calendar c
    WHERE c.assigned_to IS NOT NULL
      AND c.source_type IS NULL
      AND c.planned_date = CURRENT_DATE
  LOOP
    IF NOT notification_already_sent(r.assigned_to, 'calendar_due_today', r.id) THEN
      PERFORM create_notification(
        r.assigned_to,
        'calendar_due_today',
        'Calendar entry due today',
        '"' || r.title || '" is scheduled for today',
        'calendar',
        r.id,
        NULL,
        NULL,
        jsonb_build_object('entry_title', r.title)
      );
    END IF;
  END LOOP;

END;
$$;

COMMENT ON FUNCTION process_due_date_notifications IS
  'Called by pg_cron every hour. Inserts due-date reminder notifications with 24hr dedup.';

-- ============================================================
-- 7. Indexes
-- ============================================================
CREATE INDEX IF NOT EXISTS notifications_actor_idx
  ON notifications (actor_id)
  WHERE actor_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS notifications_email_unsent_idx
  ON notifications (created_at)
  WHERE email_sent = false AND is_dismissed = false;