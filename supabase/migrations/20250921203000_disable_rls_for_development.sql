-- Temporarily disable RLS to make tables visible in Supabase Studio
-- This is for development only - we'll re-enable with proper policies later

ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_assignments DISABLE ROW LEVEL SECURITY;