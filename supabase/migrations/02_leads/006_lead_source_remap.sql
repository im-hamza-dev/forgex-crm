-- Map legacy sources onto the new channel list and set the default.

UPDATE leads SET source = 'website' WHERE source = 'website_form';
UPDATE leads SET source = 'socials' WHERE source = 'social';

ALTER TABLE leads ALTER COLUMN source SET DEFAULT 'website';
