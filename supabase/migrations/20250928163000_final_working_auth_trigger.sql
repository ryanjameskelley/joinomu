-- Create the final working auth trigger
-- This time we'll ensure it actually gets created and works

-- Drop everything and start fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the logs table if it doesn't exist (with correct structure)
CREATE TABLE IF NOT EXISTS public.auth_trigger_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  step text,
  status text,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Grant permissions on the logs table
GRANT ALL ON public.auth_trigger_logs TO supabase_auth_admin;
GRANT SELECT ON public.auth_trigger_logs TO authenticated;

-- Create the working auth trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
  user_email TEXT;
  first_name TEXT;
  last_name TEXT;
  phone TEXT;
BEGIN
  -- Log trigger start
  INSERT INTO public.auth_trigger_logs (user_id, step, status, metadata)
  VALUES (NEW.id, 'TRIGGER_START', 'INFO', jsonb_build_object(
    'email', NEW.email,
    'raw_user_meta_data', NEW.raw_user_meta_data
  ));

  -- Extract user data safely
  user_email := NEW.email;
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  first_name := COALESCE(NEW.raw_user_meta_data->>'firstName', 
                        COALESCE(NEW.raw_user_meta_data->>'first_name', 
                                split_part(user_email, '@', 1)));
  last_name := COALESCE(NEW.raw_user_meta_data->>'lastName', 
                       COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
  phone := NEW.raw_user_meta_data->>'phone';

  INSERT INTO public.auth_trigger_logs (user_id, step, status, metadata)
  VALUES (NEW.id, 'DATA_EXTRACTED', 'SUCCESS', jsonb_build_object(
    'user_role', user_role,
    'first_name', first_name,
    'last_name', last_name,
    'has_phone', phone IS NOT NULL
  ));

  -- Create profile record
  INSERT INTO public.profiles (id, role, email, first_name, last_name, phone, created_at, updated_at)
  VALUES (NEW.id, user_role, user_email, first_name, last_name, phone, now(), now());
  
  INSERT INTO public.auth_trigger_logs (user_id, step, status, metadata)
  VALUES (NEW.id, 'PROFILE_CREATED', 'SUCCESS', jsonb_build_object(
    'profile_id', NEW.id,
    'role', user_role
  ));

  -- Create role-specific record with correct table structures
  IF user_role = 'patient' THEN
    INSERT INTO public.patients (
      id,
      profile_id,
      date_of_birth,
      phone,
      has_completed_intake,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      COALESCE((NEW.raw_user_meta_data->>'dateOfBirth')::DATE, '1990-01-01'::DATE),
      phone,
      false,
      now(),
      now()
    );
    
    INSERT INTO public.auth_trigger_logs (user_id, step, status, metadata)
    VALUES (NEW.id, 'PATIENT_CREATED', 'SUCCESS', jsonb_build_object(
      'profile_id', NEW.id
    ));
    
  ELSIF user_role = 'provider' THEN
    INSERT INTO public.providers (
      id,
      profile_id,
      specialty,
      license_number,
      phone,
      active,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'specialty', 'General'),
      NEW.raw_user_meta_data->>'licenseNumber',
      phone,
      true,
      now(),
      now()
    );
    
    INSERT INTO public.auth_trigger_logs (user_id, step, status, metadata)
    VALUES (NEW.id, 'PROVIDER_CREATED', 'SUCCESS', jsonb_build_object(
      'profile_id', NEW.id,
      'specialty', COALESCE(NEW.raw_user_meta_data->>'specialty', 'General')
    ));
    
  ELSIF user_role = 'admin' THEN
    INSERT INTO public.admins (
      id,
      profile_id,
      phone,
      active,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      phone,
      true,
      now(),
      now()
    );
    
    INSERT INTO public.auth_trigger_logs (user_id, step, status, metadata)
    VALUES (NEW.id, 'ADMIN_CREATED', 'SUCCESS', jsonb_build_object(
      'profile_id', NEW.id
    ));
  END IF;

  -- Log completion
  INSERT INTO public.auth_trigger_logs (user_id, step, status, metadata)
  VALUES (NEW.id, 'TRIGGER_COMPLETE', 'SUCCESS', jsonb_build_object(
    'final_role', user_role
  ));

  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log any errors
  INSERT INTO public.auth_trigger_logs (user_id, step, status, error_message, metadata)
  VALUES (NEW.id, 'TRIGGER_ERROR', 'FATAL', SQLERRM, jsonb_build_object(
    'sql_state', SQLSTATE
  ));
  
  -- Always return NEW to not block auth signup
  RETURN NEW;
END;
$$;

-- Grant execute permission to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant all necessary permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- Verify the trigger was created
DO $$
DECLARE
  trigger_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers 
  WHERE trigger_name = 'on_auth_user_created';
  
  IF trigger_count > 0 THEN
    RAISE NOTICE '✅ Auth trigger successfully created';
  ELSE
    RAISE NOTICE '❌ Auth trigger was NOT created';
  END IF;
END $$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Final working auth trigger for all user types';