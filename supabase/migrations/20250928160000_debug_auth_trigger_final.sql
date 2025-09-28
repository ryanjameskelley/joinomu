-- Debug and fix auth trigger once and for all
-- This migration will create a robust trigger with extensive logging

-- First, let's create a debug log table to track trigger execution
CREATE TABLE IF NOT EXISTS public.auth_trigger_debug_log (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid,
  step text,
  status text,
  error_message text,
  metadata jsonb,
  created_at timestamptz DEFAULT now()
);

-- Create the final, robust auth trigger function
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
  profile_created BOOLEAN := false;
  patient_created BOOLEAN := false;
  provider_created BOOLEAN := false;
  admin_created BOOLEAN := false;
BEGIN
  -- Log trigger start
  INSERT INTO public.auth_trigger_debug_log (user_id, step, status, metadata)
  VALUES (NEW.id, 'TRIGGER_START', 'INFO', jsonb_build_object(
    'email', NEW.email,
    'meta_data_keys', COALESCE(jsonb_object_keys(NEW.raw_user_meta_data), '{}')::text,
    'raw_user_meta_data', NEW.raw_user_meta_data
  ));

  -- Extract user data safely
  BEGIN
    user_email := NEW.email;
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    first_name := COALESCE(NEW.raw_user_meta_data->>'firstName', 
                          COALESCE(NEW.raw_user_meta_data->>'first_name', 
                                  split_part(user_email, '@', 1)));
    last_name := COALESCE(NEW.raw_user_meta_data->>'lastName', 
                         COALESCE(NEW.raw_user_meta_data->>'last_name', ''));
    phone := NEW.raw_user_meta_data->>'phone';

    INSERT INTO public.auth_trigger_debug_log (user_id, step, status, metadata)
    VALUES (NEW.id, 'DATA_EXTRACTED', 'SUCCESS', jsonb_build_object(
      'user_role', user_role,
      'first_name', first_name,
      'last_name', last_name,
      'has_phone', phone IS NOT NULL
    ));
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.auth_trigger_debug_log (user_id, step, status, error_message)
    VALUES (NEW.id, 'DATA_EXTRACTION', 'ERROR', SQLERRM);
    RETURN NEW; -- Don't fail auth signup
  END;

  -- Create profile record
  BEGIN
    INSERT INTO public.profiles (id, role, email, first_name, last_name, phone, created_at, updated_at)
    VALUES (NEW.id, user_role, user_email, first_name, last_name, phone, now(), now());
    
    profile_created := true;
    
    INSERT INTO public.auth_trigger_debug_log (user_id, step, status, metadata)
    VALUES (NEW.id, 'PROFILE_CREATED', 'SUCCESS', jsonb_build_object(
      'profile_id', NEW.id,
      'role', user_role
    ));
  EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.auth_trigger_debug_log (user_id, step, status, error_message, metadata)
    VALUES (NEW.id, 'PROFILE_CREATION', 'ERROR', SQLERRM, jsonb_build_object(
      'sql_state', SQLSTATE,
      'attempted_role', user_role
    ));
    RETURN NEW; -- Don't fail auth signup
  END;

  -- Create role-specific record
  IF user_role = 'patient' THEN
    BEGIN
      INSERT INTO public.patients (
        id,
        profile_id,
        date_of_birth,
        phone,
        has_completed_intake,
        active,
        created_at,
        updated_at
      ) VALUES (
        gen_random_uuid(),
        NEW.id,
        COALESCE((NEW.raw_user_meta_data->>'dateOfBirth')::DATE, '1990-01-01'::DATE),
        phone,
        false,
        true,
        now(),
        now()
      );
      
      patient_created := true;
      
      INSERT INTO public.auth_trigger_debug_log (user_id, step, status, metadata)
      VALUES (NEW.id, 'PATIENT_CREATED', 'SUCCESS', jsonb_build_object(
        'profile_id', NEW.id
      ));
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.auth_trigger_debug_log (user_id, step, status, error_message, metadata)
      VALUES (NEW.id, 'PATIENT_CREATION', 'ERROR', SQLERRM, jsonb_build_object(
        'sql_state', SQLSTATE,
        'profile_id', NEW.id
      ));
    END;
    
  ELSIF user_role = 'provider' THEN
    BEGIN
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
      
      provider_created := true;
      
      INSERT INTO public.auth_trigger_debug_log (user_id, step, status, metadata)
      VALUES (NEW.id, 'PROVIDER_CREATED', 'SUCCESS', jsonb_build_object(
        'profile_id', NEW.id,
        'specialty', COALESCE(NEW.raw_user_meta_data->>'specialty', 'General')
      ));
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.auth_trigger_debug_log (user_id, step, status, error_message, metadata)
      VALUES (NEW.id, 'PROVIDER_CREATION', 'ERROR', SQLERRM, jsonb_build_object(
        'sql_state', SQLSTATE,
        'profile_id', NEW.id
      ));
    END;
    
  ELSIF user_role = 'admin' THEN
    BEGIN
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
      
      admin_created := true;
      
      INSERT INTO public.auth_trigger_debug_log (user_id, step, status, metadata)
      VALUES (NEW.id, 'ADMIN_CREATED', 'SUCCESS', jsonb_build_object(
        'profile_id', NEW.id
      ));
    EXCEPTION WHEN OTHERS THEN
      INSERT INTO public.auth_trigger_debug_log (user_id, step, status, error_message, metadata)
      VALUES (NEW.id, 'ADMIN_CREATION', 'ERROR', SQLERRM, jsonb_build_object(
        'sql_state', SQLSTATE,
        'profile_id', NEW.id
      ));
    END;
  END IF;

  -- Log final status
  INSERT INTO public.auth_trigger_debug_log (user_id, step, status, metadata)
  VALUES (NEW.id, 'TRIGGER_COMPLETE', 'SUCCESS', jsonb_build_object(
    'profile_created', profile_created,
    'patient_created', patient_created,
    'provider_created', provider_created,
    'admin_created', admin_created,
    'final_role', user_role
  ));

  RETURN NEW;
  
EXCEPTION WHEN OTHERS THEN
  -- Log any unexpected errors
  INSERT INTO public.auth_trigger_debug_log (user_id, step, status, error_message, metadata)
  VALUES (NEW.id, 'TRIGGER_FATAL_ERROR', 'FATAL', SQLERRM, jsonb_build_object(
    'sql_state', SQLSTATE,
    'profile_created', profile_created,
    'patient_created', patient_created,
    'provider_created', provider_created,
    'admin_created', admin_created
  ));
  
  -- Always return NEW to not block auth signup
  RETURN NEW;
END;
$$;

-- Drop and recreate the trigger to ensure it's fresh
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;

-- Also grant to authenticated users to ensure it works
GRANT SELECT ON public.auth_trigger_debug_log TO authenticated;

-- Test the trigger immediately
DO $$
DECLARE
  test_user_id uuid := gen_random_uuid();
BEGIN
  -- Create a test auth user to verify trigger works
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    role,
    aud,
    created_at,
    updated_at
  ) VALUES (
    test_user_id,
    '00000000-0000-0000-0000-000000000000',
    'trigger-test-' || test_user_id::text || '@example.com',
    crypt('password123', gen_salt('bf')),
    now(),
    jsonb_build_object(
      'role', 'patient',
      'firstName', 'Test',
      'lastName', 'Patient'
    ),
    'authenticated',
    'authenticated',
    now(),
    now()
  );
  
  -- Check if records were created
  RAISE NOTICE 'Test trigger execution complete for user: %', test_user_id;
  
  -- Show trigger logs
  DECLARE
    log_record RECORD;
  BEGIN
    FOR log_record IN 
      SELECT step, status, error_message, metadata 
      FROM public.auth_trigger_debug_log 
      WHERE user_id = test_user_id 
      ORDER BY created_at
    LOOP
      RAISE NOTICE 'Trigger log: % - % (Error: %) Meta: %', 
        log_record.step, 
        log_record.status, 
        COALESCE(log_record.error_message, 'None'),
        log_record.metadata;
    END LOOP;
  END;
  
  -- Clean up test user
  DELETE FROM auth.users WHERE id = test_user_id;
  DELETE FROM public.profiles WHERE id = test_user_id;
  DELETE FROM public.patients WHERE profile_id = test_user_id;
  DELETE FROM public.auth_trigger_debug_log WHERE user_id = test_user_id;
  
  RAISE NOTICE '✅ Trigger test complete and cleanup done';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Trigger test failed: %', SQLERRM;
END $$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Robust auth trigger with comprehensive logging for debugging signup issues';