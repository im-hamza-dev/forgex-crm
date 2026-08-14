-- Blog covers storage policies
-- Create public bucket "blog-covers" in Supabase dashboard first.

CREATE POLICY "blog cover upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'blog-covers');

CREATE POLICY "blog cover read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'blog-covers');

CREATE POLICY "blog cover delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'blog-covers');
