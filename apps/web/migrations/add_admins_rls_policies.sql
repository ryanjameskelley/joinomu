-- Enable RLS on admins table if not already enabled
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to insert their own admin record (for signup)
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

-- Policy to allow super admins to read all admin data (optional - for admin management)
-- CREATE POLICY "Super admins can read all admin data" ON public.admins
-- FOR SELECT 
-- TO authenticated 
-- USING (
--   EXISTS (
--     SELECT 1 FROM public.admins 
--     WHERE user_id = auth.uid() 
--     AND 'super_admin' = ANY(permissions)
--   )
-- );