-- Create student profile images storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('student-profiles', 'student-profiles', true);

-- Create RLS policies for student profile images
CREATE POLICY "Public can view student profile images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'student-profiles');

CREATE POLICY "Admins can upload student profile images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'student-profiles' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can update student profile images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'student-profiles' AND
  public.has_role(auth.uid(), 'admin')
);

CREATE POLICY "Admins can delete student profile images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'student-profiles' AND
  public.has_role(auth.uid(), 'admin')
);