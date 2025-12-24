# Self-Hosting Guide: School Meal System

This guide walks you through migrating the School Meal System from Lovable Cloud to your own Supabase project.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Step 1: Create Supabase Project](#step-1-create-supabase-project)
3. [Step 2: Export Data from Lovable Cloud](#step-2-export-data-from-lovable-cloud)
4. [Step 3: Run Database Migrations](#step-3-run-database-migrations)
5. [Step 4: Import Your Data](#step-4-import-your-data)
6. [Step 5: Configure Storage Buckets](#step-5-configure-storage-buckets)
7. [Step 6: Deploy Edge Functions](#step-6-deploy-edge-functions)
8. [Step 7: Configure Authentication](#step-7-configure-authentication)
9. [Step 8: Set Up Environment Variables](#step-8-set-up-environment-variables)
10. [Step 9: Deploy Your Application](#step-9-deploy-your-application)
11. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before starting, ensure you have:

- [ ] Node.js 18+ installed
- [ ] Git installed
- [ ] Supabase CLI installed (`npm install -g supabase`)
- [ ] A Supabase account at [supabase.com](https://supabase.com)
- [ ] A Resend account for email functionality at [resend.com](https://resend.com)
- [ ] Your data exported from the `/backup` page

---

## Step 1: Create Supabase Project

### 1.1 Create a New Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click **New Project**
3. Fill in:
   - **Project name**: `school-meal-system`
   - **Database password**: (save this securely!)
   - **Region**: Choose closest to your users
4. Click **Create new project**
5. Wait for project to be provisioned (~2 minutes)

### 1.2 Get Your Credentials

After creation, navigate to **Settings → API** and note down:

```
Project URL: https://YOUR_PROJECT_ID.supabase.co
Anon/Public Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Service Role Key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9... (keep secret!)
```

---

## Step 2: Export Data from Lovable Cloud

### 2.1 Access the Backup Page

1. Navigate to `/backup` in your current Lovable app
2. Download each table as JSON:
   - `students.json`
   - `staff.json`
   - `meals.json`
   - `meal_ratings.json`
   - `meal_schedules.json`
   - `weekly_menus.json`
   - `weekly_menu_templates.json`
   - `announcements.json`
   - `user_roles.json`
   - `profiles.json`
   - `feedback_likes.json`
   - `student_announcement_dismissals.json`

### 2.2 Download Storage Files

From the backup page, download all files from:
- `student-profiles` bucket (profile images)
- `meal-photos` bucket (meal rating photos)

### 2.3 Export User List

Note down the user emails and their roles from the backup page. You'll need to recreate these users in your new Supabase project.

---

## Step 3: Run Database Migrations

### 3.1 Open SQL Editor

1. In your Supabase dashboard, go to **SQL Editor**
2. Click **New Query**

### 3.2 Run the Migration Script

Copy and run the complete migration script from `/migration-script.sql` or use the following sections in order:

#### Part 1: Create Enums

```sql
-- Create custom enum types
CREATE TYPE public.app_role AS ENUM ('admin', 'staff', 'student');
CREATE TYPE public.meal_type AS ENUM ('breakfast', 'lunch', 'dinner');
CREATE TYPE public.student_status AS ENUM ('active', 'suspended', 'under_standard');
```

#### Part 2: Create UUID Extension

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA extensions;
```

#### Part 3: Create Tables

Run each table creation statement from the migration script. Key tables include:
- `profiles`
- `user_roles`
- `students`
- `staff`
- `meals`
- `meal_ratings`
- `feedback_likes`
- `announcements`
- `student_announcement_dismissals`
- `weekly_menus`
- `weekly_menu_templates`
- `meal_schedules`

#### Part 4: Create Database Functions

```sql
-- Function to check user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
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

-- Function to generate student ID
CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
CREATE OR REPLACE FUNCTION public.create_staff_role(_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'staff')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Function to toggle like
CREATE OR REPLACE FUNCTION public.toggle_like(_rating_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  existing_like uuid;
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

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

-- Function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;
```

#### Part 5: Create Trigger for New Users

```sql
-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

#### Part 6: Enable Row Level Security

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_announcement_dismissals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.weekly_menu_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_schedules ENABLE ROW LEVEL SECURITY;
```

#### Part 7: Create RLS Policies

Run all RLS policies from the migration script. These control data access based on user roles.

---

## Step 4: Import Your Data

### 4.1 Prepare Your Data

For each JSON file, you'll need to import it via the Supabase Table Editor or SQL.

### 4.2 Using Table Editor (Recommended for Small Datasets)

1. Go to **Table Editor** in Supabase dashboard
2. Select the table (e.g., `students`)
3. Click **Insert** → **Import data from CSV**
4. Convert your JSON to CSV first, or use the SQL method below

### 4.3 Using SQL Insert (For Larger Datasets)

Convert your JSON data to SQL INSERT statements. Example:

```sql
INSERT INTO public.students (id, student_id, full_name, grade, sex, status, user_id, allergies, dietary_needs)
VALUES 
  ('uuid-here', '1', 'John Doe', 'Grade 10', 'Male', 'active', 'user-uuid', NULL, NULL),
  ('uuid-here', '2', 'Jane Smith', 'Grade 11', 'Female', 'active', 'user-uuid', 'Peanuts', 'Vegetarian');
```

### 4.4 Import Order (Important!)

Import tables in this order to satisfy foreign key constraints:

1. `profiles` (after creating users)
2. `user_roles` (after creating users)
3. `students`
4. `staff`
5. `meal_schedules`
6. `weekly_menu_templates`
7. `weekly_menus`
8. `announcements`
9. `meals`
10. `meal_ratings`
11. `feedback_likes`
12. `student_announcement_dismissals`

---

## Step 5: Configure Storage Buckets

### 5.1 Create Storage Buckets

Go to **Storage** in Supabase dashboard and create:

```sql
-- Run in SQL Editor
INSERT INTO storage.buckets (id, name, public) 
VALUES ('student-profiles', 'student-profiles', true);

INSERT INTO storage.buckets (id, name, public) 
VALUES ('meal-photos', 'meal-photos', true);
```

### 5.2 Create Storage Policies

```sql
-- Student profiles bucket policies
CREATE POLICY "Public read access for student profiles"
ON storage.objects FOR SELECT
USING (bucket_id = 'student-profiles');

CREATE POLICY "Authenticated users can upload student profiles"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'student-profiles' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update student profiles"
ON storage.objects FOR UPDATE
USING (bucket_id = 'student-profiles' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete student profiles"
ON storage.objects FOR DELETE
USING (bucket_id = 'student-profiles' AND auth.role() = 'authenticated');

-- Meal photos bucket policies
CREATE POLICY "Public read access for meal photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'meal-photos');

CREATE POLICY "Authenticated users can upload meal photos"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'meal-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update meal photos"
ON storage.objects FOR UPDATE
USING (bucket_id = 'meal-photos' AND auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete meal photos"
ON storage.objects FOR DELETE
USING (bucket_id = 'meal-photos' AND auth.role() = 'authenticated');
```

### 5.3 Upload Storage Files

1. Go to **Storage** → select bucket
2. Click **Upload files**
3. Upload the files you downloaded from the backup

---

## Step 6: Deploy Edge Functions

### 6.1 Install Supabase CLI

```bash
npm install -g supabase
```

### 6.2 Login to Supabase

```bash
supabase login
```

### 6.3 Link Your Project

```bash
supabase link --project-ref YOUR_PROJECT_ID
```

### 6.4 Set Edge Function Secrets

```bash
# Resend API key for sending emails
supabase secrets set RESEND_API_KEY=your_resend_api_key

# Resend webhook secret (if using email webhooks)
supabase secrets set RESEND_WEBHOOK_SECRET=your_webhook_secret
```

### 6.5 Deploy Edge Functions

The project includes these edge functions:

```
supabase/functions/
├── create-staff-user/       # Creates staff accounts (admin only)
├── create-student-user/     # Creates student accounts (admin only)
├── delete-student-user/     # Deletes student accounts (admin only)
├── cleanup-orphaned-users/  # Removes orphaned auth users (admin only)
├── send-password-reset/     # Sends password reset emails
├── send-password-change-confirmation/  # Confirms password changes
└── receive-email/           # Webhook for incoming emails
```

Deploy all functions:

```bash
supabase functions deploy create-staff-user
supabase functions deploy create-student-user
supabase functions deploy delete-student-user
supabase functions deploy cleanup-orphaned-users
supabase functions deploy send-password-reset
supabase functions deploy send-password-change-confirmation
supabase functions deploy receive-email
```

### 6.6 Configure Edge Function Settings

In `supabase/config.toml`, ensure JWT verification is configured:

```toml
[functions.create-staff-user]
verify_jwt = true

[functions.create-student-user]
verify_jwt = true

[functions.delete-student-user]
verify_jwt = true

[functions.cleanup-orphaned-users]
verify_jwt = true

[functions.send-password-reset]
verify_jwt = false

[functions.send-password-change-confirmation]
verify_jwt = false

[functions.receive-email]
verify_jwt = false
```

---

## Step 7: Configure Authentication

### 7.1 Enable Email Auth

1. Go to **Authentication** → **Providers**
2. Ensure **Email** is enabled
3. Configure settings:
   - ✅ Enable email confirmations (optional for testing)
   - ✅ Enable email change confirmations
   - ✅ Secure password change

### 7.2 Disable Email Confirmation (For Testing)

For easier testing, disable email confirmation:

1. Go to **Authentication** → **Email Templates**
2. Or go to **Authentication** → **Settings**
3. Toggle off "Enable email confirmations"

### 7.3 Configure Site URL

1. Go to **Authentication** → **URL Configuration**
2. Set **Site URL**: `https://your-domain.com`
3. Add **Redirect URLs**:
   - `https://your-domain.com/`
   - `https://your-domain.com/auth`
   - `http://localhost:5173/` (for local development)
   - `http://localhost:5173/auth`

### 7.4 Recreate Users

Since passwords cannot be exported, you'll need to recreate users:

#### Option A: Manual Creation (Recommended for Admins)

1. Go to **Authentication** → **Users**
2. Click **Add user**
3. Enter email and password
4. After creation, add their role via SQL:

```sql
INSERT INTO public.user_roles (user_id, role)
VALUES ('user-uuid-here', 'admin');
```

#### Option B: Password Reset Flow

1. Create users with temporary passwords
2. Send password reset emails to users
3. Users set their own passwords

### 7.5 Set Up Initial Admin

```sql
-- After creating admin user in Authentication
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::app_role
FROM auth.users
WHERE email = 'admin@yourschool.com';
```

---

## Step 8: Set Up Environment Variables

### 8.1 Create .env File

Create a `.env` file in your project root:

```env
VITE_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_here
VITE_SUPABASE_PROJECT_ID=YOUR_PROJECT_ID
```

### 8.2 Update Supabase Client

Modify `src/integrations/supabase/client.ts`:

```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});
```

---

## Step 9: Deploy Your Application

### 9.1 Build for Production

```bash
npm run build
```

### 9.2 Deploy Options

#### Vercel

```bash
npm install -g vercel
vercel
```

Add environment variables in Vercel dashboard.

#### Netlify

```bash
npm install -g netlify-cli
netlify deploy --prod
```

Add environment variables in Netlify dashboard.

#### Self-Hosted (Nginx)

1. Build the app: `npm run build`
2. Copy `dist/` folder to your server
3. Configure Nginx:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/school-meal-system/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

---

## Troubleshooting

### Common Issues

#### "Permission denied" errors

- Check RLS policies are created correctly
- Verify user has correct role in `user_roles` table
- Ensure JWT token is valid

#### Edge functions not working

1. Check function logs: `supabase functions logs function-name`
2. Verify secrets are set: `supabase secrets list`
3. Check CORS headers in function code

#### Users can't log in

1. Verify user exists in **Authentication** → **Users**
2. Check `user_roles` table has entry for user
3. Ensure Site URL and Redirect URLs are configured

#### Storage uploads failing

1. Check storage bucket exists
2. Verify storage policies are created
3. Ensure bucket is set to public (for this app)

### Getting Help

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
- [Supabase GitHub Issues](https://github.com/supabase/supabase/issues)

---

## Security Checklist

Before going live, ensure:

- [ ] All RLS policies are in place
- [ ] Service role key is NOT exposed in frontend code
- [ ] Email confirmation is enabled for production
- [ ] Strong password requirements configured
- [ ] Rate limiting enabled for auth endpoints
- [ ] HTTPS enabled on your domain
- [ ] Environment variables secured (not committed to git)

---

## Maintenance

### Regular Tasks

- Monitor edge function logs for errors
- Review authentication logs for suspicious activity
- Backup database regularly
- Update dependencies periodically

### Backup Commands

```bash
# Export database
supabase db dump -f backup.sql

# Export specific table
supabase db dump -f students_backup.sql --data-only --table=students
```

---

**Migration Complete!** 🎉

Your School Meal System is now running on your own Supabase infrastructure.
