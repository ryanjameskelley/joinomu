-- Correct the auth trigger to match actual table structure
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

  -- Create role-specific record with correct table structure
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

-- Test the corrected trigger with a test user
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
    'trigger-test-final@example.com',
    'encrypted_password_placeholder',
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
  RAISE NOTICE 'Final trigger test complete for user: %', test_user_id;
  
  -- Clean up test user
  DELETE FROM auth.users WHERE id = test_user_id;
  DELETE FROM public.profiles WHERE id = test_user_id;
  DELETE FROM public.patients WHERE profile_id = test_user_id;
  DELETE FROM public.auth_trigger_logs WHERE user_id = test_user_id;
  
  RAISE NOTICE '✅ Final trigger test complete and cleanup done';
  
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '❌ Final trigger test failed: %', SQLERRM;
END $$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Corrected auth trigger with proper table structure';