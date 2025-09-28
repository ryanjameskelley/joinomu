-- Fix auth trigger to properly create provider records and schedules
-- The issue is likely in the provider creation or schedule creation logic

-- First, let's make sure the function has better error handling and logging
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
  RAISE NOTICE 'handle_new_user triggered for user %', NEW.id;
  
  -- Extract role from raw_user_meta_data only (this is what actually exists)
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
  BEGIN
    INSERT INTO public.profiles (id, email, role, first_name, last_name)
    VALUES (
      NEW.id,
      NEW.email,
      user_role,
      first_name_val,
      last_name_val
    );
    RAISE NOTICE 'Created profile for user %', NEW.id;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE NOTICE 'Error creating profile for user %: %', NEW.id, SQLERRM;
      RETURN NEW;
  END;
  
  -- Create role-specific record
  IF user_role = 'patient' THEN
    BEGIN
      INSERT INTO public.patients (profile_id, date_of_birth, phone, has_completed_intake)
      VALUES (NEW.id, date_of_birth_val, phone_val, false);
      RAISE NOTICE 'Created patient record for user %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error creating patient for user %: %', NEW.id, SQLERRM;
    END;
    
  ELSIF user_role = 'admin' THEN
    BEGIN
      INSERT INTO public.admins (profile_id, permissions, active)
      VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true);
      RAISE NOTICE 'Created admin record for user %', NEW.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error creating admin for user %: %', NEW.id, SQLERRM;
    END;
    
  ELSIF user_role = 'provider' THEN
    BEGIN
      -- Insert provider record and get the generated ID
      INSERT INTO public.providers (profile_id, specialty, license_number, phone, active)
      VALUES (NEW.id, COALESCE(specialty_val, 'General Practice'), COALESCE(license_number_val, 'PENDING'), phone_val, true)
      RETURNING id INTO new_provider_id;
      
      RAISE NOTICE 'Created provider record % for user %', new_provider_id, NEW.id;
      
      -- Create default Monday-Friday 9-5 schedule for the new provider
      BEGIN
        INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
        (new_provider_id, 1, '09:00:00', '17:00:00', true, now()),
        (new_provider_id, 2, '09:00:00', '17:00:00', true, now()),
        (new_provider_id, 3, '09:00:00', '17:00:00', true, now()),
        (new_provider_id, 4, '09:00:00', '17:00:00', true, now()),
        (new_provider_id, 5, '09:00:00', '17:00:00', true, now());
        
        RAISE NOTICE 'Created 5 default schedules for provider %', new_provider_id;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE NOTICE 'Error creating schedules for provider %: %', new_provider_id, SQLERRM;
      END;
      
    EXCEPTION
      WHEN OTHERS THEN
        RAISE NOTICE 'Error creating provider for user %: %', NEW.id, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
  
EXCEPTION 
  WHEN OTHERS THEN
    -- Log error but don't fail the user creation
    RAISE NOTICE 'General error in handle_new_user for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;