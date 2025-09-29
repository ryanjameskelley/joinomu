-- Completely disable the auth trigger as recommended in the authentication guide
-- This allows the auth service fallback pattern to handle all record creation

-- Drop the trigger completely
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Drop the function as well to prevent conflicts
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Verify the trigger is gone
SELECT 
  'Auth trigger disabled' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
    THEN '❌ Trigger still exists'
    ELSE '✅ Trigger removed'
  END as trigger_status;

-- Grant necessary permissions to ensure auth service can work
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT USAGE ON SCHEMA public TO postgres;

-- Enable the auth service fallback pattern by ensuring proper permissions
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;  
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Create service role policies to allow auth service to manage records
DROP POLICY IF EXISTS "Service role can manage all profiles" ON public.profiles;
CREATE POLICY "Service role can manage all profiles" 
  ON public.profiles 
  FOR ALL 
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage all patients" ON public.patients;
CREATE POLICY "Service role can manage all patients"
  ON public.patients
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage all providers" ON public.providers;
CREATE POLICY "Service role can manage all providers" 
  ON public.providers
  FOR ALL
  USING (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role can manage all admins" ON public.admins;
CREATE POLICY "Service role can manage all admins"
  ON public.admins 
  FOR ALL
  USING (auth.role() = 'service_role');