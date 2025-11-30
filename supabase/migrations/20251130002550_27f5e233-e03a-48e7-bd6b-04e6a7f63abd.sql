-- Create table to track dismissed announcements per student
CREATE TABLE IF NOT EXISTS public.student_announcement_dismissals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(student_id, announcement_id)
);

-- Enable RLS
ALTER TABLE public.student_announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- Students can view their own dismissals
CREATE POLICY "Students can view own dismissals"
ON public.student_announcement_dismissals
FOR SELECT
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Students can dismiss announcements
CREATE POLICY "Students can dismiss announcements"
ON public.student_announcement_dismissals
FOR INSERT
WITH CHECK (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);

-- Students can un-dismiss announcements
CREATE POLICY "Students can un-dismiss announcements"
ON public.student_announcement_dismissals
FOR DELETE
USING (
  student_id IN (
    SELECT id FROM public.students WHERE user_id = auth.uid()
  )
);