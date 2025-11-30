-- Create storage bucket for meal photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-photos', 'meal-photos', true);

-- Add image_url column to meal_ratings table
ALTER TABLE public.meal_ratings
ADD COLUMN image_url TEXT;

-- Storage policies for meal photos
CREATE POLICY "Students can upload meal photos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'meal-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view own meal photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'meal-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can view all meal photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'meal-photos' AND
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Staff can view all meal photos"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'meal-photos' AND
  has_role(auth.uid(), 'staff'::app_role)
);

CREATE POLICY "Students can delete own meal photos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meal-photos' AND
  auth.uid()::text = (storage.foldername(name))[1]
);