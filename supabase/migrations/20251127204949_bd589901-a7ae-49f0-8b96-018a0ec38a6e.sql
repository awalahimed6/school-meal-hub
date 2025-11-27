-- Fix critical security vulnerabilities by removing overly permissive RLS policies
-- and adding proper authenticated access controls

-- ============================================
-- 1. FIX STAFF TABLE PUBLIC ACCESS
-- ============================================
-- Remove the public access policy
DROP POLICY IF EXISTS "Anyone can view staff" ON public.staff;

-- Staff should only be viewable by authenticated admin and staff users
-- (Admin policy already exists, no additional policy needed)


-- ============================================
-- 2. FIX STUDENTS TABLE PUBLIC ACCESS
-- ============================================
-- Remove the public access policy for active students
DROP POLICY IF EXISTS "Anyone can view active students" ON public.students;

-- Students can now only be viewed by:
-- - Admins (existing policy)
-- - Staff (existing policy)
-- - The student themselves (existing policy)


-- ============================================
-- 3. FIX MEALS TABLE PUBLIC ACCESS
-- ============================================
-- Remove the public access policy
DROP POLICY IF EXISTS "Anyone can view meals" ON public.meals;

-- Add policy for students to view their own meal records
CREATE POLICY "Students can view own meals" 
ON public.meals 
FOR SELECT 
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Meals can now only be viewed by:
-- - Admins (existing policy)
-- - Staff (via existing admin policy or we should add explicit staff view policy)
-- - Students viewing their own meals (new policy)

-- Add explicit staff view policy for meals
CREATE POLICY "Staff can view meals" 
ON public.meals 
FOR SELECT 
USING (has_role(auth.uid(), 'staff'::app_role));


-- ============================================
-- 4. FIX ANNOUNCEMENTS TABLE PUBLIC ACCESS
-- ============================================
-- Remove the public access policy
DROP POLICY IF EXISTS "Anyone can view announcements" ON public.announcements;

-- Add authenticated-only access for announcements
-- All authenticated users (admin, staff, students) can view announcements
CREATE POLICY "Authenticated users can view announcements" 
ON public.announcements 
FOR SELECT 
USING (auth.role() = 'authenticated');