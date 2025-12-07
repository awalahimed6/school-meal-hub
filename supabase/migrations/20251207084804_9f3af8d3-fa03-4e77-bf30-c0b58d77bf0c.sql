-- Add last_checked_voice column to students table for tracking unread public voice feedback
ALTER TABLE public.students 
ADD COLUMN last_checked_voice timestamptz DEFAULT now();