-- ============================================================
-- 07_notifications / 004_cron.sql
-- Run this manually in Supabase SQL editor AFTER 002 is applied.
-- Requires pg_cron extension (enabled on Supabase free tier).
-- ============================================================

-- Enable pg_cron if not already enabled
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Remove existing job if re-running
SELECT cron.unschedule('due-date-reminders')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'due-date-reminders'
);

-- Schedule the function every hour at :00
SELECT cron.schedule(
  'due-date-reminders',
  '0 * * * *',
  'SELECT process_due_date_notifications()'
);