-- Fix missing auth trigger - recreate it properly

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Make sure the function exists in public schema with full path specification
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  first_name_val TEXT;
  last_name_val TEXT;
  date_of_birth_val DATE;
  phone_val TEXT;
  specialty_val TEXT;
  license_number_val TEXT;
  new_provider_id UUID;
BEGIN
  RAISE NOTICE 'AUTH TRIGGER FIRED: handle_new_user for user % with email %', NEW.id, NEW.email;
  
  -- Extract role from raw_user_meta_data
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'patient'
  );
  
  RAISE NOTICE 'User role determined as: %', user_role;
  
  -- Extract names from raw_user_meta_data
  first_name_val := COALESCE(
    NEW.raw_user_meta_data->>'firstName',
    NEW.raw_user_meta_data->>'first_name',
    'User'
  );
  
  last_name_val := COALESCE(
    NEW.raw_user_meta_data->>'lastName',
    NEW.raw_user_meta_data->>'last_name',
    'Name'
  );
  
  -- Extract optional fields
  phone_val := NEW.raw_user_meta_data->>'phone';
  specialty_val := NEW.raw_user_meta_data->>'specialty';
  license_number_val := COALESCE(
    NEW.raw_user_meta_data->>'licenseNumber',
    NEW.raw_user_meta_data->>'license_number'
  );
  
  -- Create profile record
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    first_name_val,
    last_name_val
  );
  RAISE NOTICE 'Created profile for user %', NEW.id;
  
  -- Create role-specific record
  IF user_role = 'provider' THEN
    -- Insert provider record and get the generated ID
    INSERT INTO public.providers (profile_id, specialty, license_number, phone, active)
    VALUES (NEW.id, COALESCE(specialty_val, 'General Practice'), COALESCE(license_number_val, 'PENDING'), phone_val, true)
    RETURNING id INTO new_provider_id;
    
    RAISE NOTICE 'Created provider record % for user %', new_provider_id, NEW.id;
    
    -- Create default Monday-Friday 9-5 schedule
    INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
    (new_provider_id, 1, '09:00:00', '17:00:00', true, now()),
    (new_provider_id, 2, '09:00:00', '17:00:00', true, now()),
    (new_provider_id, 3, '09:00:00', '17:00:00', true, now()),
    (new_provider_id, 4, '09:00:00', '17:00:00', true, now()),
    (new_provider_id, 5, '09:00:00', '17:00:00', true, now());
    
    RAISE NOTICE 'Created 5 default schedules for provider %', new_provider_id;
    
  ELSIF user_role = 'patient' THEN
    INSERT INTO public.patients (profile_id, phone, has_completed_intake)
    VALUES (NEW.id, phone_val, false);
    RAISE NOTICE 'Created patient record for user %', NEW.id;
    
  ELSIF user_role = 'admin' THEN
    INSERT INTO public.admins (profile_id, permissions, active)
    VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true);
    RAISE NOTICE 'Created admin record for user %', NEW.id;
  END IF;
  
  RETURN NEW;
  
EXCEPTION 
  WHEN OTHERS THEN
    RAISE NOTICE 'ERROR in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users table
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Verify creation
DO $$
BEGIN
    RAISE NOTICE 'Auth trigger recreated successfully';
END $$;