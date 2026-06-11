
CREATE POLICY "invoices_read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'invoices');
CREATE POLICY "invoices_upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'invoices');
CREATE POLICY "invoices_update_own" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'invoices' AND owner = auth.uid());
CREATE POLICY "invoices_delete_own" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'invoices' AND owner = auth.uid());
