
-- Storage: meal-photos — drop broad authenticated access, keep ownership + admin/staff role
DROP POLICY IF EXISTS "Authenticated users can view meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload meal photos" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own meal photos" ON storage.objects;

-- Admin delete for meal photos (was missing)
CREATE POLICY "Admins can delete meal photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'meal-photos' AND has_role(auth.uid(), 'admin'::app_role));

-- Storage: student-profiles — drop broad authenticated SELECT, restrict to admin/staff or owning student
DROP POLICY IF EXISTS "Authenticated can view student profile images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can view student profiles" ON storage.objects;

CREATE POLICY "Admins and staff can view student profile images"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-profiles'
  AND (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'staff'::app_role))
);

CREATE POLICY "Students can view own profile image"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'student-profiles'
  AND EXISTS (
    SELECT 1 FROM public.students s
    WHERE s.user_id = auth.uid()
      AND (
        (storage.foldername(name))[1] = s.id::text
        OR (storage.foldername(name))[1] = s.student_id
        OR position(s.id::text in name) > 0
        OR position(s.student_id in name) > 0
      )
  )
);

-- Storage: prevent listing of public buckets (files remain accessible via direct public URL/CDN)
DROP POLICY IF EXISTS "Anyone can view campus gallery images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view meal videos" ON storage.objects;

-- Harden has_role: null-safe, still SECURITY DEFINER (required for role checks inside RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _user_id IS NULL THEN
    RETURN false;
  END IF;
  RETURN EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- Lock down SECURITY DEFINER helpers from direct client execution.
-- has_role is invoked from inside RLS/SECURITY DEFINER contexts, so client EXECUTE is not required.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, app_role) FROM PUBLIC, anon, authenticated;

-- ID generators are only used by SECURITY DEFINER admin flows / server-side code.
REVOKE EXECUTE ON FUNCTION public.generate_staff_id() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.generate_student_id() FROM PUBLIC, anon, authenticated;

-- Staff role assignment is only called by trusted edge functions with service role.
REVOKE EXECUTE ON FUNCTION public.create_staff_role(uuid) FROM PUBLIC, anon, authenticated;

-- Trigger helpers should never be called directly by clients.
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;

-- toggle_like is a user-facing RPC: keep it callable by authenticated users only.
REVOKE EXECUTE ON FUNCTION public.toggle_like(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.toggle_like(uuid) TO authenticated;
