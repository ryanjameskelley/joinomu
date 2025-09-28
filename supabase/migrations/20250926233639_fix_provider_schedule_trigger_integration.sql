-- Fix provider schedule trigger integration with auth trigger
-- The issue is that the auth trigger creates provider records but the schedule trigger might not be firing

-- First, let's modify the auth trigger to also create schedules for providers
CREATE OR REPLACE FUNCTION handle_new_user()
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
  -- Extract role from raw_user_meta_data only (this is what actually exists)
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    'patient'
  );
  
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
  
  -- Extract optional fields from raw_user_meta_data
  phone_val := NEW.raw_user_meta_data->>'phone';
  specialty_val := NEW.raw_user_meta_data->>'specialty';
  license_number_val := COALESCE(
    NEW.raw_user_meta_data->>'licenseNumber',
    NEW.raw_user_meta_data->>'license_number'
  );
  
  -- Handle date of birth with proper error handling
  BEGIN
    date_of_birth_val := (COALESCE(
      NEW.raw_user_meta_data->>'dateOfBirth',
      NEW.raw_user_meta_data->>'date_of_birth'
    ))::DATE;
  EXCEPTION
    WHEN OTHERS THEN
      date_of_birth_val := NULL;
  END;
  
  -- Create profile record
  INSERT INTO public.profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    first_name_val,
    last_name_val
  );
  
  -- Create role-specific record
  IF user_role = 'patient' THEN
    INSERT INTO public.patients (profile_id, date_of_birth, phone, has_completed_intake)
    VALUES (NEW.id, date_of_birth_val, phone_val, false);
    
  ELSIF user_role = 'admin' THEN
    INSERT INTO public.admins (profile_id, permissions, active)
    VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true);
    
  ELSIF user_role = 'provider' THEN
    -- Insert provider record and get the generated ID
    INSERT INTO public.providers (profile_id, specialty, license_number, phone, active)
    VALUES (NEW.id, COALESCE(specialty_val, 'General Practice'), COALESCE(license_number_val, 'PENDING'), phone_val, true)
    RETURNING id INTO new_provider_id;
    
    -- Create default Monday-Friday 9-5 schedule for the new provider
    RAISE NOTICE 'Creating default schedule for provider %', new_provider_id;
    
    INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
    (new_provider_id, 1, '09:00:00', '17:00:00', true, now()),
    (new_provider_id, 2, '09:00:00', '17:00:00', true, now()),
    (new_provider_id, 3, '09:00:00', '17:00:00', true, now()),
    (new_provider_id, 4, '09:00:00', '17:00:00', true, now()),
    (new_provider_id, 5, '09:00:00', '17:00:00', true, now());
    
    RAISE NOTICE 'Created default schedule for provider %', new_provider_id;
  END IF;
  
  RETURN NEW;
  
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RAISE NOTICE 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;