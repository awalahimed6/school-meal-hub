-- Allow students to update their own last_checked_voice and last_checked_announcements timestamps
CREATE POLICY "Students can update own notification timestamps" 
ON public.students 
FOR UPDATE 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);