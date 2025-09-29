-- Create the auth trigger function for automatic user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
DECLARE
  user_role TEXT DEFAULT 'patient';
  first_name TEXT DEFAULT 'User';
  last_name TEXT DEFAULT 'Unknown';
  phone_val TEXT;
  specialty_val TEXT;
  license_number_val TEXT;
  new_provider_id UUID;
  schedule_days TEXT[] := ARRAY['monday', 'tuesday', 'wednesday', 'thursday', 'friday'];
  day_name TEXT;
BEGIN
  -- Extract user metadata safely
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.user_metadata->>'role',
    'patient'
  );
  
  first_name := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.raw_user_meta_data->>'firstName',
    NEW.user_metadata->>'first_name',
    NEW.user_metadata->>'firstName',
    'User'
  );
  
  last_name := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.raw_user_meta_data->>'lastName',
    NEW.user_metadata->>'last_name',
    NEW.user_metadata->>'lastName',
    'Unknown'
  );
  
  phone_val := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.user_metadata->>'phone'
  );
  
  specialty_val := COALESCE(
    NEW.raw_user_meta_data->>'specialty',
    NEW.user_metadata->>'specialty',
    'General Practice'
  );
  
  license_number_val := COALESCE(
    NEW.raw_user_meta_data->>'licenseNumber',
    NEW.raw_user_meta_data->>'license_number',
    NEW.user_metadata->>'licenseNumber',
    NEW.user_metadata->>'license_number'
  );

  -- Create profile record
  INSERT INTO public.profiles (
    id, email, first_name, last_name, role, created_at, updated_at
  ) VALUES (
    NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW()
  );

  -- Create role-specific records
  IF user_role = 'patient' THEN
    INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
    VALUES (NEW.id, phone_val, false, NOW(), NOW());
    
  ELSIF user_role = 'provider' THEN
    INSERT INTO public.providers (profile_id, specialty, license_number, phone, active, created_at, updated_at)
    VALUES (NEW.id, specialty_val, license_number_val, phone_val, true, NOW(), NOW())
    RETURNING id INTO new_provider_id;
    
    -- Create provider schedule
    IF new_provider_id IS NOT NULL THEN
      FOREACH day_name IN ARRAY schedule_days LOOP
        INSERT INTO public.provider_schedules (
          provider_id, day_of_week, start_time, end_time, treatment_types, created_at, updated_at
        ) VALUES (
          new_provider_id, day_name, '09:00:00', '17:00:00', 
          ARRAY['weight_loss', 'diabetes_management'], NOW(), NOW()
        );
      END LOOP;
    END IF;
    
  ELSIF user_role = 'admin' THEN
    INSERT INTO public.admins (profile_id, permissions, created_at, updated_at)
    VALUES (NEW.id, 'full', NOW(), NOW());
  END IF;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'Auth trigger error: %', SQLERRM;
  RETURN NEW;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;