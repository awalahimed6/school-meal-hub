-- Reset staff table policies to fix RLS insert error
DROP POLICY IF EXISTS "Admins can manage staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can insert staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can view all staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can update staff" ON public.staff;
DROP POLICY IF EXISTS "Admins can delete staff" ON public.staff;
DROP POLICY IF EXISTS "Staff can create own staff record" ON public.staff;

-- Allow staff users to create their own staff record
CREATE POLICY "Staff can create own staff record"
ON public.staff
FOR INSERT
TO authenticated
WITH CHECK (user_id = auth.uid());

-- Admins manage staff
CREATE POLICY "Admins can view staff"
ON public.staff
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update staff"
ON public.staff
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete staff"
ON public.staff
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));
