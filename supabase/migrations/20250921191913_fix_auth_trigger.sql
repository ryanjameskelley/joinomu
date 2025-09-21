-- Fix the authentication trigger to handle user_metadata properly
-- The issue is that admin.createUser puts data in user_metadata, not raw_user_meta_data

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create the improved authentication trigger function
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
BEGIN
  -- Log the trigger execution for debugging
  RAISE LOG 'handle_new_user triggered for user: %', NEW.id;
  RAISE LOG 'raw_user_meta_data: %', NEW.raw_user_meta_data;
  RAISE LOG 'user_metadata: %', NEW.user_metadata;
  
  -- Extract role from either raw_user_meta_data or user_metadata
  user_role := COALESCE(
    NEW.raw_user_meta_data->>'role',
    NEW.user_metadata->>'role',
    'patient'
  );
  
  -- Extract other fields similarly
  first_name_val := COALESCE(
    NEW.raw_user_meta_data->>'first_name',
    NEW.user_metadata->>'first_name',
    'User'
  );
  
  last_name_val := COALESCE(
    NEW.raw_user_meta_data->>'last_name',
    NEW.user_metadata->>'last_name',
    'Name'
  );
  
  phone_val := COALESCE(
    NEW.raw_user_meta_data->>'phone',
    NEW.user_metadata->>'phone'
  );
  
  specialty_val := COALESCE(
    NEW.raw_user_meta_data->>'specialty',
    NEW.user_metadata->>'specialty'
  );
  
  license_number_val := COALESCE(
    NEW.raw_user_meta_data->>'license_number',
    NEW.user_metadata->>'license_number'
  );
  
  -- Handle date of birth with proper error handling
  BEGIN
    date_of_birth_val := (COALESCE(
      NEW.raw_user_meta_data->>'date_of_birth',
      NEW.user_metadata->>'date_of_birth'
    ))::DATE;
  EXCEPTION
    WHEN OTHERS THEN
      date_of_birth_val := NULL;
  END;
  
  RAISE LOG 'Processed values - role: %, first_name: %, last_name: %', user_role, first_name_val, last_name_val;
  
  -- Create profile record first
  INSERT INTO profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    user_role,
    first_name_val,
    last_name_val
  );
  
  RAISE LOG 'Profile created for user: %', NEW.id;
  
  -- Create role-specific record based on profile.role
  IF (user_role = 'patient') THEN
    INSERT INTO patients (profile_id, date_of_birth, phone, has_completed_intake)
    VALUES (
      NEW.id,
      date_of_birth_val,
      phone_val,
      false
    );
    RAISE LOG 'Patient record created for user: %', NEW.id;
    
  ELSIF (user_role = 'admin') THEN
    INSERT INTO admins (profile_id, permissions, active)
    VALUES (
      NEW.id,
      ARRAY['dashboard', 'patients', 'providers', 'assignments'],
      true
    );
    RAISE LOG 'Admin record created for user: %', NEW.id;
    
  ELSIF (user_role = 'provider') THEN
    INSERT INTO providers (profile_id, specialty, license_number, phone, active)
    VALUES (
      NEW.id,
      COALESCE(specialty_val, 'General Practice'),
      COALESCE(license_number_val, 'PENDING'),
      phone_val,
      true
    );
    RAISE LOG 'Provider record created for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
    -- Don't fail the auth signup if user record creation fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();