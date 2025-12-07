-- Add is_public column to meal_ratings
ALTER TABLE public.meal_ratings ADD COLUMN is_public boolean NOT NULL DEFAULT false;

-- Create feedback_likes table
CREATE TABLE public.feedback_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  rating_id uuid NOT NULL REFERENCES public.meal_ratings(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE (rating_id, user_id)
);

-- Enable RLS on feedback_likes
ALTER TABLE public.feedback_likes ENABLE ROW LEVEL SECURITY;

-- RLS: Anyone can read likes (for count display)
CREATE POLICY "Anyone can view likes"
ON public.feedback_likes
FOR SELECT
USING (true);

-- RLS: Authenticated users can insert their own likes
CREATE POLICY "Authenticated users can like"
ON public.feedback_likes
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- RLS: Users can delete their own likes
CREATE POLICY "Users can unlike their own"
ON public.feedback_likes
FOR DELETE
USING (auth.uid() = user_id);

-- Create toggle_like function
CREATE OR REPLACE FUNCTION public.toggle_like(_rating_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_like uuid;
BEGIN
  -- Check if like exists
  SELECT id INTO existing_like
  FROM public.feedback_likes
  WHERE rating_id = _rating_id AND user_id = _user_id;
  
  IF existing_like IS NOT NULL THEN
    -- Unlike: delete the record
    DELETE FROM public.feedback_likes WHERE id = existing_like;
    RETURN false; -- now unliked
  ELSE
    -- Like: insert new record
    INSERT INTO public.feedback_likes (rating_id, user_id) VALUES (_rating_id, _user_id);
    RETURN true; -- now liked
  END IF;
END;
$$;

-- Add RLS policy for public meal ratings to be viewable
CREATE POLICY "Anyone can view public ratings"
ON public.meal_ratings
FOR SELECT
USING (is_public = true);