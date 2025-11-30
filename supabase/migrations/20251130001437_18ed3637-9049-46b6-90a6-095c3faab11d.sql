-- Add last_checked_announcements column to students table
ALTER TABLE public.students 
ADD COLUMN last_checked_announcements TIMESTAMP WITH TIME ZONE DEFAULT NULL;