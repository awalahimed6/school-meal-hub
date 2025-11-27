-- Drop the old function
DROP FUNCTION IF EXISTS public.assign_role(uuid, app_role);

-- Create a new function that allows staff role assignment during signup
CREATE OR REPLACE FUNCTION public.create_staff_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Insert staff role for the new user
  -- This function bypasses RLS and can only be called by authenticated users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'staff')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.create_staff_role(uuid) TO authenticated;