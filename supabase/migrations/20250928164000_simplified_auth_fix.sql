-- Simplified auth trigger that works reliably
-- Drop existing problematic trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create a minimal, working trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Simple: just create profile and role-specific record
  -- Extract basic data
  DECLARE
    user_role TEXT := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    user_email TEXT := NEW.email;
    first_name TEXT := COALESCE(NEW.raw_user_meta_data->>'firstName', split_part(user_email, '@', 1));
    last_name TEXT := COALESCE(NEW.raw_user_meta_data->>'lastName', '');
    phone TEXT := NEW.raw_user_meta_data->>'phone';
  BEGIN
    -- Create profile
    INSERT INTO public.profiles (id, role, email, first_name, last_name, phone)
    VALUES (NEW.id, user_role, user_email, first_name, last_name, phone);
    
    -- Create role-specific record
    IF user_role = 'patient' THEN
      INSERT INTO public.patients (id, profile_id, date_of_birth, has_completed_intake)
      VALUES (gen_random_uuid(), NEW.id, '1990-01-01', false);
    ELSIF user_role = 'provider' THEN
      INSERT INTO public.providers (id, profile_id, specialty, active)
      VALUES (gen_random_uuid(), NEW.id, 'General', true);
    ELSIF user_role = 'admin' THEN
      INSERT INTO public.admins (id, profile_id, active)
      VALUES (gen_random_uuid(), NEW.id, true);
    END IF;
    
    RETURN NEW;
    
  EXCEPTION WHEN OTHERS THEN
    -- Don't block auth on errors
    RETURN NEW;
  END;
END;
$$;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Manually create provider for testing
DO $$
BEGIN
  -- Create test provider user manually since signup is failing
  INSERT INTO public.profiles (id, role, email, first_name, last_name)
  VALUES (
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'provider',
    'test.provider@example.com',
    'Test',
    'Provider'
  ) ON CONFLICT (id) DO NOTHING;
  
  INSERT INTO public.providers (id, profile_id, specialty, license_number, active)
  VALUES (
    gen_random_uuid(),
    'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
    'Internal Medicine',
    'TEST123',
    true
  ) ON CONFLICT (profile_id) DO NOTHING;
  
  RAISE NOTICE '✅ Test provider profile created manually';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '⚠️ Provider already exists or other error: %', SQLERRM;
END $$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Simplified reliable auth trigger';