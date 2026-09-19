-- TLDR field for blog posts (already present in live DB; tracked here for repo parity)
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS tldr text;

COMMENT ON COLUMN public.blog_posts.tldr IS
  'Longer key takeaways / TL;DR block shown on the public post (separate from excerpt/meta description).';
