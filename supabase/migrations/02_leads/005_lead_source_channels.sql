-- Expand lead_source with channel values used in the CRM UI.
-- Existing values are kept so current rows remain valid.

ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'linkedin';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'upwork';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'instagram';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'facebook';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'website';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'indiehacker';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'socials';
ALTER TYPE lead_source ADD VALUE IF NOT EXISTS 'twitter';
