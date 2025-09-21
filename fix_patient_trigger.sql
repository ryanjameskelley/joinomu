-- Fix the patient trigger to properly create patient records

-- First, let's recreate the handle_new_user function with proper patient creation
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user trigger fired for user: %', NEW.id;
  RAISE LOG 'User metadata: %', NEW.raw_user_meta_data;
  
  -- Check what role is specified in metadata
  IF NEW.raw_user_meta_data->>'role' = 'patient' THEN
    RAISE LOG 'Creating patient record for user: %', NEW.id;
    
    -- Insert into patients table
    INSERT INTO patients (
      id,
      user_id,
      email,
      first_name,
      last_name,
      date_of_birth,
      phone,
      has_completed_intake,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Patient'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
      NEW.raw_user_meta_data->>'date_of_birth',
      NEW.raw_user_meta_data->>'phone',
      false,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Patient record created successfully for user: %', NEW.id;
    
  ELSIF NEW.raw_user_meta_data->>'role' = 'admin' THEN
    RAISE LOG 'Creating admin record for user: %', NEW.id;
    
    -- Insert into admins table
    INSERT INTO admins (
      id,
      user_id,
      email,
      first_name,
      last_name,
      role,
      permissions,
      active,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
      'admin',
      ARRAY['messages', 'patients', 'dashboard'],
      true,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Admin record created successfully for user: %', NEW.id;
    
  ELSIF NEW.raw_user_meta_data->>'role' = 'provider' THEN
    RAISE LOG 'Creating provider record for user: %', NEW.id;
    
    -- Insert into providers table
    INSERT INTO providers (
      id,
      user_id,
      email,
      first_name,
      last_name,
      specialty,
      license_number,
      phone,
      active,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Provider'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
      COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Practice'),
      COALESCE(NEW.raw_user_meta_data->>'license_number', 'TEMP-LICENSE'),
      NEW.raw_user_meta_data->>'phone',
      true,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Provider record created successfully for user: %', NEW.id;
    
  ELSE
    RAISE LOG 'No specific role found, defaulting to patient for user: %', NEW.id;
    
    -- Default to patient if no role specified
    INSERT INTO patients (
      id,
      user_id,
      email,
      first_name,
      last_name,
      has_completed_intake,
      created_at,
      updated_at
    ) VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.email,
      'Patient',
      'User',
      false,
      NOW(),
      NOW()
    );
    
    RAISE LOG 'Default patient record created for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user trigger: %', SQLERRM;
    -- Don't fail the auth signup if user record creation fails
    RETURN NEW;
END;
$$;

-- Ensure the trigger exists on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Test the function with a manual execution to see logs
-- (This won't actually create a user, just test the function structure)
DO $$
BEGIN
  RAISE LOG 'Trigger function recreated successfully';
END $$;