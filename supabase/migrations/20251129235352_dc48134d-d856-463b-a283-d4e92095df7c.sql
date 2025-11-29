-- Add RLS policy for admins to delete meal ratings
CREATE POLICY "Admins can delete meal ratings"
ON public.meal_ratings
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));