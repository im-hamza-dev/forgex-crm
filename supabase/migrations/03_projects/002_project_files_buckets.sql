CREATE POLICY "project files upload" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'project-files');

CREATE POLICY "project files read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'project-files');

CREATE POLICY "project files delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'project-files');