-- Public-site RLS gaps vs forgex.systems Phase 1 requirements.
-- Safe to re-run: drops/creates only the named policies below.
--
-- Already present in CRM 001_blog.sql (do NOT recreate):
--   public_read_published_posts (blog_posts anon SELECT published)
--   public_read_categories (blog_categories anon SELECT)
--   public_read_approved_comments (blog_comments anon SELECT approved)

DROP POLICY IF EXISTS "Community users can submit comments" ON blog_comments;
CREATE POLICY "Community users can submit comments"
ON blog_comments
FOR INSERT
TO authenticated
WITH CHECK (
  community_user_id IN (
    SELECT id FROM community_users
    WHERE auth_user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Public can read community user display info" ON community_users;
CREATE POLICY "Public can read community user display info"
ON community_users
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "Users can create their own community profile" ON community_users;
CREATE POLICY "Users can create their own community profile"
ON community_users
FOR INSERT
TO authenticated
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own community profile" ON community_users;
CREATE POLICY "Users can update their own community profile"
ON community_users
FOR UPDATE
TO authenticated
USING (auth_user_id = auth.uid())
WITH CHECK (auth_user_id = auth.uid());

DROP POLICY IF EXISTS "Public can read blog author profile display" ON profiles;
CREATE POLICY "Public can read blog author profile display"
ON profiles
FOR SELECT
TO anon
USING (
  id IN (
    SELECT author_id FROM blog_posts WHERE status = 'published'
  )
);
