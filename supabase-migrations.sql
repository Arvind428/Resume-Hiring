-- Supabase DDL Migration for Phase 4 Extension (Authentication & RBAC)
-- Run this directly in the Supabase SQL Editor to append the required metrics.

-- 1. Create the base profiles table linking natively to built-in auth.users
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users on delete cascade not null primary key,
  role text default 'candidate' check (role in ('admin', 'candidate')),
  email text,
  full_name text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Turn on RLS for robust perimeter security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can insert their own profile." ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile." ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Automatic Trigger to shadow-copy new signups directly into the profiles API table
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', COALESCE(new.raw_user_meta_data->>'role', 'candidate'));
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe trigger creation bounds
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Append AI metrics to candidates (for safe re-run)
ALTER TABLE candidates 
ADD COLUMN IF NOT EXISTS skills_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS experience_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS project_score numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS analysis_strengths jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS analysis_weaknesses jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS analysis_missing jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS interview_questions jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id); -- Links a candidate back to an authenticated Applicant login
