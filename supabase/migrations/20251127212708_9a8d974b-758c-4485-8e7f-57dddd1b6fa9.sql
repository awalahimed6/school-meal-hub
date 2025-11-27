-- Add allergy and dietary needs columns to students table
ALTER TABLE public.students
ADD COLUMN allergies text,
ADD COLUMN dietary_needs text;

COMMENT ON COLUMN public.students.allergies IS 'Critical allergy information for the student';
COMMENT ON COLUMN public.students.dietary_needs IS 'Dietary restrictions and special needs';