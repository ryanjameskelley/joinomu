-- ============================================
-- RLS POLICIES FOR PATIENTS AND ADMINS TABLES
-- Copy and paste this entire script into Supabase Dashboard > Database > SQL Editor
-- ============================================

-- PATIENTS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on patients table
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own patient record" ON public.patients;
DROP POLICY IF EXISTS "Users can read their own patient data" ON public.patients;
DROP POLICY IF EXISTS "Users can update their own patient data" ON public.patients;
DROP POLICY IF EXISTS "Users can delete their own patient data" ON public.patients;

-- Policy to allow authenticated users to insert their own patient record
CREATE POLICY "Users can insert their own patient record" ON public.patients
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to read their own patient data
CREATE POLICY "Users can read their own patient data" ON public.patients
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy to allow users to update their own patient data
CREATE POLICY "Users can update their own patient data" ON public.patients
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy to allow users to delete their own patient data
CREATE POLICY "Users can delete their own patient data" ON public.patients
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);


-- ADMINS TABLE RLS POLICIES
-- ============================================

-- Enable RLS on admins table
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can insert their own admin record" ON public.admins;
DROP POLICY IF EXISTS "Admins can read their own admin data" ON public.admins;
DROP POLICY IF EXISTS "Admins can update their own admin data" ON public.admins;

-- Policy to allow authenticated users to insert their own admin record
CREATE POLICY "Users can insert their own admin record" ON public.admins
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

-- Policy to allow admins to read their own admin data
CREATE POLICY "Admins can read their own admin data" ON public.admins
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

-- Policy to allow admins to update their own admin data
CREATE POLICY "Admins can update their own admin data" ON public.admins
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- VERIFICATION QUERIES (optional - run to verify policies were created)
-- ============================================

-- Check patients table policies
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'patients';

-- Check admins table policies
SELECT schemaname, tablename, policyname, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'admins';