-- Add explicit anonymous access denial policies for defense-in-depth
-- These policies provide an additional security layer by explicitly denying
-- unauthenticated access, even though the existing policies already require authentication

-- Deny anonymous access to profiles table
CREATE POLICY "Deny anonymous access to profiles" 
ON public.profiles 
FOR SELECT 
TO anon 
USING (false);

-- Deny anonymous access to students table
CREATE POLICY "Deny anonymous access to students" 
ON public.students 
FOR SELECT 
TO anon 
USING (false);

-- Deny anonymous access to staff table
CREATE POLICY "Deny anonymous access to staff" 
ON public.staff 
FOR SELECT 
TO anon 
USING (false);

-- Deny anonymous access to user_roles table
CREATE POLICY "Deny anonymous access to user_roles" 
ON public.user_roles 
FOR SELECT 
TO anon 
USING (false);

-- Deny anonymous access to meals table
CREATE POLICY "Deny anonymous access to meals" 
ON public.meals 
FOR SELECT 
TO anon 
USING (false);

-- Deny anonymous access to announcements table
CREATE POLICY "Deny anonymous access to announcements" 
ON public.announcements 
FOR SELECT 
TO anon 
USING (false);