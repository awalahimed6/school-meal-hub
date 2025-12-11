-- Fix 1: Update feedback_likes RLS policy to require authentication
DROP POLICY IF EXISTS "Anyone can view likes" ON feedback_likes;
CREATE POLICY "Authenticated users can view likes" ON feedback_likes
  FOR SELECT USING (auth.role() = 'authenticated');

-- Fix 2: Update student-profiles storage policy to require authentication
DROP POLICY IF EXISTS "Public can view student profile images" ON storage.objects;
CREATE POLICY "Authenticated can view student profile images" ON storage.objects
  FOR SELECT USING (bucket_id = 'student-profiles' AND auth.role() = 'authenticated');