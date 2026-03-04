-- Add storage RLS policies for private buckets so authenticated users can still access files

-- student-profiles: authenticated users can read, admins/staff can upload
CREATE POLICY "Authenticated users can view student profiles"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'student-profiles');

CREATE POLICY "Admins can upload student profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'student-profiles' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update student profiles"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'student-profiles' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete student profiles"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'student-profiles' AND public.has_role(auth.uid(), 'admin'));

-- meal-photos: authenticated users can read, students can upload their own
CREATE POLICY "Authenticated users can view meal photos"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'meal-photos');

CREATE POLICY "Authenticated users can upload meal photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'meal-photos');

CREATE POLICY "Users can delete own meal photos"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'meal-photos' AND (storage.foldername(name))[1] = auth.uid()::text);