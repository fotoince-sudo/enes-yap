CREATE POLICY "talep_dosya_yukleme" ON storage.objects FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'talep-dosyalari' AND (storage.foldername(name))[1] = 'talep');
CREATE POLICY "talep_dosya_personel_okuma" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'talep-dosyalari' AND public.is_staff(auth.uid()));
CREATE POLICY "talep_dosya_personel_silme" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'talep-dosyalari' AND public.is_staff(auth.uid()));