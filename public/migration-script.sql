-- =====================================================
-- COMPLETE SUPABASE MIGRATION SCRIPT
-- School Meal Management System
-- Generated: 2024-12-11
-- =====================================================

-- =====================================================
-- STEP 1: CREATE ENUMS
-- =====================================================

CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'student');
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner');
CREATE TYPE public.student_status AS ENUM ('active', 'suspended', 'under_standard');

-- =====================================================
-- STEP 2: CREATE TABLES
-- =====================================================

-- Profiles table (linked to auth.users)
CREATE TABLE public.profiles (
  id UUID NOT NULL PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- User roles table
CREATE TABLE public.user_roles (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL,
  role public.app_role NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- Students table
CREATE TABLE public.students (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  student_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  sex TEXT NOT NULL,
  status public.student_status NOT NULL DEFAULT 'active'::student_status,
  allergies TEXT,
  dietary_needs TEXT,
  profile_image TEXT,
  last_checked_announcements TIMESTAMP WITH TIME ZONE,
  last_checked_voice TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Staff table
CREATE TABLE public.staff (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  user_id UUID,
  staff_id TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  position TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meals table (attendance records)
CREATE TABLE public.meals (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  meal_type public.meal_type NOT NULL,
  meal_date DATE NOT NULL DEFAULT CURRENT_DATE,
  recorded_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meal ratings table
CREATE TABLE public.meal_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  meal_type public.meal_type NOT NULL,
  meal_date DATE NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  image_url TEXT,
  is_public BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Meal schedules table
CREATE TABLE public.meal_schedules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  meal_type TEXT NOT NULL,
  start_time TIME WITHOUT TIME ZONE NOT NULL,
  end_time TIME WITHOUT TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Announcements table
CREATE TABLE public.announcements (
  id UUID NOT NULL DEFAULT extensions.uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  posted_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weekly menus table
CREATE TABLE public.weekly_menus (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  date DATE NOT NULL,
  meal_type public.meal_type NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Weekly menu templates table
CREATE TABLE public.weekly_menu_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week TEXT NOT NULL,
  meal_type TEXT NOT NULL,
  main_dish TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (day_of_week, meal_type)
);

-- Feedback likes table
CREATE TABLE public.feedback_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  rating_id UUID NOT NULL REFERENCES public.meal_ratings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (rating_id, user_id)
);

-- Student announcement dismissals table
CREATE TABLE public.student_announcement_dismissals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  announcement_id UUID NOT NULL REFERENCES public.announcements(id) ON DELETE CASCADE,
  dismissed_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE (student_id, announcement_id)
);

-- =====================================================
-- STEP 3: CREATE FUNCTIONS
-- =====================================================

-- Function to check user role (prevents infinite recursion in RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Function to generate sequential student ID
CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_id TEXT;
  max_id INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(student_id AS INTEGER)), 0) INTO max_id
  FROM public.students
  WHERE student_id ~ '^[0-9]+$';
  
  new_id := (max_id + 1)::TEXT;
  RETURN new_id;
END;
$$;

-- Function to generate staff ID
CREATE OR REPLACE FUNCTION public.generate_staff_id()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  new_id TEXT;
  id_exists BOOLEAN;
BEGIN
  LOOP
    new_id := 'STF' || LPAD(floor(random() * 999999)::TEXT, 6, '0');
    SELECT EXISTS(SELECT 1 FROM public.staff WHERE staff_id = new_id) INTO id_exists;
    EXIT WHEN NOT id_exists;
  END LOOP;
  RETURN new_id;
END;
$$;

-- Function to create staff role
CREATE OR REPLACE FUNCTION public.create_staff_role(_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'staff')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Function to toggle like on feedback
CREATE OR REPLACE FUNCTION public.toggle_like(_rating_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  existing_like UUID;
BEGIN
  SELECT id INTO existing_like
  FROM public.feedback_likes
  WHERE rating_id = _rating_id AND user_id = _user_id;
  
  IF existing_like IS NOT NULL THEN
    DELETE FROM public.feedback_likes WHERE id = existing_like;
    RETURN false;
  ELSE
    INSERT INTO public.feedback_likes (rating_id, user_id) VALUES (_rating_id, _user_id);
    RETURN true;
  END IF;
END;
$$;

-- Function to handle new user signup (creates profile)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- =====================================================
-- STEP 4: CREATE TRIGGERS
-- =====================================================

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- STEP 5: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_announcement_dismissals ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- STEP 6: CREATE RLS POLICIES
-- =====================================================

-- PROFILES POLICIES
CREATE POLICY "Deny anonymous access to profiles" ON public.profiles
  FOR SELECT USING (false);
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- USER_ROLES POLICIES
CREATE POLICY "Deny anonymous access to user_roles" ON public.user_roles
  FOR SELECT USING (false);
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can insert any role" ON public.user_roles
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update roles" ON public.user_roles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete roles" ON public.user_roles
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- STUDENTS POLICIES
CREATE POLICY "Deny anonymous access to students" ON public.students
  FOR SELECT USING (false);
CREATE POLICY "Students can view own record" ON public.students
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Students can update own notification timestamps" ON public.students
  FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can view students" ON public.students
  FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- STAFF POLICIES
CREATE POLICY "Deny anonymous access to staff" ON public.staff
  FOR SELECT USING (false);
CREATE POLICY "Admins can view staff" ON public.staff
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update staff" ON public.staff
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete staff" ON public.staff
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Staff can create own staff record" ON public.staff
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- MEALS POLICIES
CREATE POLICY "Deny anonymous access to meals" ON public.meals
  FOR SELECT USING (false);
CREATE POLICY "Students can view own meals" ON public.meals
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Staff can view meals" ON public.meals
  FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Staff can record meals" ON public.meals
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Staff can update meals" ON public.meals
  FOR UPDATE USING (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Admins can manage meals" ON public.meals
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- MEAL_RATINGS POLICIES
CREATE POLICY "Deny anonymous access to meal_ratings" ON public.meal_ratings
  FOR SELECT USING (false);
CREATE POLICY "Students can view own ratings" ON public.meal_ratings
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Students can insert own ratings" ON public.meal_ratings
  FOR INSERT WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Students can update own ratings" ON public.meal_ratings
  FOR UPDATE USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Authenticated can view public ratings" ON public.meal_ratings
  FOR SELECT USING (is_public = true AND auth.role() = 'authenticated');
CREATE POLICY "Staff can view all ratings" ON public.meal_ratings
  FOR SELECT USING (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Admins can view all ratings" ON public.meal_ratings
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete meal ratings" ON public.meal_ratings
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- MEAL_SCHEDULES POLICIES
CREATE POLICY "Everyone can read schedules" ON public.meal_schedules
  FOR SELECT USING (true);
CREATE POLICY "Only admins can update schedules" ON public.meal_schedules
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- ANNOUNCEMENTS POLICIES
CREATE POLICY "Deny anonymous access to announcements" ON public.announcements
  FOR SELECT USING (false);
CREATE POLICY "Authenticated users can view announcements" ON public.announcements
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Staff can create announcements" ON public.announcements
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'staff'::app_role));
CREATE POLICY "Staff can update own announcements" ON public.announcements
  FOR UPDATE USING (auth.uid() = posted_by);
CREATE POLICY "Staff can delete own announcements" ON public.announcements
  FOR DELETE USING (auth.uid() = posted_by);
CREATE POLICY "Admins can manage all announcements" ON public.announcements
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- WEEKLY_MENUS POLICIES
CREATE POLICY "Deny anonymous access to weekly menus" ON public.weekly_menus
  FOR SELECT USING (false);
CREATE POLICY "Authenticated users can view weekly menus" ON public.weekly_menus
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Admins can manage weekly menus" ON public.weekly_menus
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- WEEKLY_MENU_TEMPLATES POLICIES
CREATE POLICY "Everyone can read menu templates" ON public.weekly_menu_templates
  FOR SELECT USING (true);
CREATE POLICY "Admins can insert menu templates" ON public.weekly_menu_templates
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update menu templates" ON public.weekly_menu_templates
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete menu templates" ON public.weekly_menu_templates
  FOR DELETE USING (has_role(auth.uid(), 'admin'::app_role));

-- FEEDBACK_LIKES POLICIES
CREATE POLICY "Authenticated users can view likes" ON public.feedback_likes
  FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can like" ON public.feedback_likes
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike their own" ON public.feedback_likes
  FOR DELETE USING (auth.uid() = user_id);

-- STUDENT_ANNOUNCEMENT_DISMISSALS POLICIES
CREATE POLICY "Students can view own dismissals" ON public.student_announcement_dismissals
  FOR SELECT USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Students can dismiss announcements" ON public.student_announcement_dismissals
  FOR INSERT WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Students can un-dismiss announcements" ON public.student_announcement_dismissals
  FOR DELETE USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));

-- =====================================================
-- STEP 7: CREATE STORAGE BUCKETS
-- =====================================================

INSERT INTO storage.buckets (id, name, public) VALUES ('student-profiles', 'student-profiles', true);
INSERT INTO storage.buckets (id, name, public) VALUES ('meal-photos', 'meal-photos', true);

-- STORAGE POLICIES FOR student-profiles bucket
CREATE POLICY "Public read access for student profiles"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'student-profiles');

CREATE POLICY "Admins can upload student profiles"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'student-profiles' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update student profiles"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'student-profiles' AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete student profiles"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'student-profiles' AND has_role(auth.uid(), 'admin'::app_role));

-- STORAGE POLICIES FOR meal-photos bucket
CREATE POLICY "Public read access for meal photos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'meal-photos');

CREATE POLICY "Authenticated users can upload meal photos"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'meal-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Users can delete own meal photos"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'meal-photos' AND auth.uid()::text = (storage.foldername(name))[1]);

-- =====================================================
-- STEP 8: INSERT DEFAULT DATA
-- =====================================================

-- Insert default meal schedules
INSERT INTO public.meal_schedules (meal_type, start_time, end_time, is_active) VALUES
  ('breakfast', '06:00:00', '08:00:00', true),
  ('lunch', '12:00:00', '14:00:00', true),
  ('dinner', '18:00:00', '19:00:00', true);

-- Insert default weekly menu templates
INSERT INTO public.weekly_menu_templates (day_of_week, meal_type, main_dish, description) VALUES
  ('Monday', 'breakfast', 'Not set', 'Menu not configured yet'),
  ('Monday', 'lunch', 'Not set', 'Menu not configured yet'),
  ('Monday', 'dinner', 'Not set', 'Menu not configured yet'),
  ('Tuesday', 'breakfast', 'Not set', 'Menu not configured yet'),
  ('Tuesday', 'lunch', 'Not set', 'Menu not configured yet'),
  ('Tuesday', 'dinner', 'Not set', 'Menu not configured yet'),
  ('Wednesday', 'breakfast', 'Not set', 'Menu not configured yet'),
  ('Wednesday', 'lunch', 'Not set', 'Menu not configured yet'),
  ('Wednesday', 'dinner', 'Not set', 'Menu not configured yet'),
  ('Thursday', 'breakfast', 'Not set', 'Menu not configured yet'),
  ('Thursday', 'lunch', 'Not set', 'Menu not configured yet'),
  ('Thursday', 'dinner', 'Not set', 'Menu not configured yet'),
  ('Friday', 'breakfast', 'Not set', 'Menu not configured yet'),
  ('Friday', 'lunch', 'Not set', 'Menu not configured yet'),
  ('Friday', 'dinner', 'Not set', 'Menu not configured yet'),
  ('Saturday', 'breakfast', 'Not set', 'Menu not configured yet'),
  ('Saturday', 'lunch', 'Not set', 'Menu not configured yet'),
  ('Saturday', 'dinner', 'Not set', 'Menu not configured yet'),
  ('Sunday', 'breakfast', 'Not set', 'Menu not configured yet'),
  ('Sunday', 'lunch', 'Not set', 'Menu not configured yet'),
  ('Sunday', 'dinner', 'Not set', 'Menu not configured yet');

-- =====================================================
-- NOTES FOR MIGRATION
-- =====================================================
-- 
-- IMPORTANT: After running this script:
-- 
-- 1. Create your first admin user manually:
--    - Sign up via your app or Supabase Auth dashboard
--    - Then insert the admin role:
--      INSERT INTO public.user_roles (user_id, role) 
--      VALUES ('your-admin-user-id', 'admin');
--
-- 2. Import your data from the backup JSON files
--    - Students, staff, meals, etc.
--
-- 3. Configure Supabase Auth settings:
--    - Enable "Auto-confirm email" for testing
--    - Set up Password HIBP check
--    - Configure Site URL and Redirect URLs
--
-- 4. Update your app's environment variables:
--    - VITE_SUPABASE_URL=your-supabase-url
--    - VITE_SUPABASE_PUBLISHABLE_KEY=your-anon-key
--
-- 5. Deploy Edge Functions manually to your Supabase project
--    - See supabase/functions/ folder
--
-- =====================================================
