-- Create meal_ratings table
CREATE TABLE public.meal_ratings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  meal_date date NOT NULL,
  meal_type meal_type NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(student_id, meal_date, meal_type)
);

-- Enable RLS
ALTER TABLE public.meal_ratings ENABLE ROW LEVEL SECURITY;

-- Students can view their own ratings
CREATE POLICY "Students can view own ratings"
ON public.meal_ratings
FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Students can insert their own ratings
CREATE POLICY "Students can insert own ratings"
ON public.meal_ratings
FOR INSERT
WITH CHECK (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Students can update their own ratings
CREATE POLICY "Students can update own ratings"
ON public.meal_ratings
FOR UPDATE
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

-- Admins can view all ratings
CREATE POLICY "Admins can view all ratings"
ON public.meal_ratings
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- Staff can view all ratings
CREATE POLICY "Staff can view all ratings"
ON public.meal_ratings
FOR SELECT
USING (has_role(auth.uid(), 'staff'::app_role));

-- Deny anonymous access
CREATE POLICY "Deny anonymous access to meal_ratings"
ON public.meal_ratings
FOR SELECT
USING (false);