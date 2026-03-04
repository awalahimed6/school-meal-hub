
-- Drop old function that accepts user_id parameter
DROP FUNCTION IF EXISTS public.toggle_like(uuid, uuid);

-- Create secure version that uses auth.uid() server-side
CREATE OR REPLACE FUNCTION public.toggle_like(_rating_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_like uuid;
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  SELECT id INTO existing_like
  FROM public.feedback_likes
  WHERE rating_id = _rating_id AND user_id = current_user_id;
  
  IF existing_like IS NOT NULL THEN
    DELETE FROM public.feedback_likes WHERE id = existing_like;
    RETURN false;
  ELSE
    INSERT INTO public.feedback_likes (rating_id, user_id) 
    VALUES (_rating_id, current_user_id);
    RETURN true;
  END IF;
END;
$$;
