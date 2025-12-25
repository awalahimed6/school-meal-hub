-- Create storage bucket for campus gallery images
INSERT INTO storage.buckets (id, name, public)
VALUES ('campus-gallery', 'campus-gallery', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage bucket for meal system videos
INSERT INTO storage.buckets (id, name, public)
VALUES ('meal-videos', 'meal-videos', true)
ON CONFLICT (id) DO NOTHING;

-- Create table for gallery images
CREATE TABLE public.gallery_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for meal system video
CREATE TABLE public.meal_system_video (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL DEFAULT 'Meal System Demo',
  description TEXT,
  video_url TEXT,
  thumbnail_url TEXT,
  is_active BOOLEAN DEFAULT true,
  uploaded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.gallery_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_system_video ENABLE ROW LEVEL SECURITY;

-- Public can view active gallery images
CREATE POLICY "Anyone can view active gallery images"
ON public.gallery_images
FOR SELECT
USING (is_active = true);

-- Admin can manage gallery images
CREATE POLICY "Admins can manage gallery images"
ON public.gallery_images
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Public can view active video
CREATE POLICY "Anyone can view active meal video"
ON public.meal_system_video
FOR SELECT
USING (is_active = true);

-- Admin can manage video
CREATE POLICY "Admins can manage meal video"
ON public.meal_system_video
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Storage policies for campus-gallery bucket
CREATE POLICY "Anyone can view campus gallery images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'campus-gallery');

CREATE POLICY "Admins can upload campus gallery images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'campus-gallery' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete campus gallery images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'campus-gallery' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Storage policies for meal-videos bucket
CREATE POLICY "Anyone can view meal videos"
ON storage.objects
FOR SELECT
USING (bucket_id = 'meal-videos');

CREATE POLICY "Admins can upload meal videos"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'meal-videos' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

CREATE POLICY "Admins can delete meal videos"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'meal-videos' AND
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_gallery_images_updated_at
BEFORE UPDATE ON public.gallery_images
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_meal_system_video_updated_at
BEFORE UPDATE ON public.meal_system_video
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();