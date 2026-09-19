-- Blog email subscribers (inline opt-in capture on forgex.systems)
-- Safe to add: no FK dependencies, no impact on existing CRM tables

CREATE TABLE public.blog_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  source_post_slug text,
  subscribed_at timestamptz NOT NULL DEFAULT now(),
  status text NOT NULL DEFAULT 'active',
  CONSTRAINT blog_subscribers_email_unique UNIQUE (email),
  CONSTRAINT blog_subscribers_status_check
    CHECK (status IN ('active', 'unsubscribed'))
);

ALTER TABLE blog_subscribers ENABLE ROW LEVEL SECURITY;

-- Public site can insert (subscribe)
CREATE POLICY "Public can subscribe to blog"
ON blog_subscribers
FOR INSERT
TO anon
WITH CHECK (true);

-- CRM team can read all subscribers
CREATE POLICY "Team can read blog subscribers"
ON blog_subscribers
FOR SELECT
TO authenticated
USING (true);

-- CRM team can update subscriber status (unsubscribe management)
CREATE POLICY "Team can update blog subscriber status"
ON blog_subscribers
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);
