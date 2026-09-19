-- Add optional description on leads
ALTER TABLE leads
  ADD COLUMN IF NOT EXISTS description text;

COMMENT ON COLUMN leads.description IS 'Free-text notes about the lead opportunity, needs, or context.';
