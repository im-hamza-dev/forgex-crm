-- ============================================================
-- 07_notifications / 003_realtime.sql
-- Enable Realtime for notifications table.
-- Run this in Supabase SQL editor after migration if
-- ALTER PUBLICATION is not supported in your migration runner.
-- ============================================================

-- Add notifications table to Realtime publication
-- This allows clients to subscribe to INSERT events filtered by user_id
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;