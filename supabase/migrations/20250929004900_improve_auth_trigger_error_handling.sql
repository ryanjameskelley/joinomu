-- Improve auth trigger error handling without deleting existing data
-- This migration only enhances the existing trigger with better error handling

-- Create an improved version of the handle_new_user function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger execution with more detail
  RAISE LOG 'handle_new_user triggered for user: %, email: %, role: %', NEW.id, NEW.email, NEW.raw_user_meta_data->>'role';
  
  BEGIN
    -- Create profile record first
    INSERT INTO profiles (id, email, role, first_name, last_name)
    VALUES (
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name')
    );
    RAISE LOG 'Profile record created successfully for user: %', NEW.id;
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'Profile already exists for user: %, skipping', NEW.id;
    WHEN OTHERS THEN
      RAISE LOG 'Error creating profile for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
      RAISE; -- Re-raise the error to fail the signup
  END;
  
  -- Create role-specific record based on profile.role
  BEGIN
    IF (COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'patient') THEN
      INSERT INTO patients (profile_id, date_of_birth, phone, has_completed_intake)
      VALUES (
        NEW.id,
        (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
        NEW.raw_user_meta_data->>'phone',
        false
      );
      RAISE LOG 'Patient record created for user: %', NEW.id;
      
    ELSIF (NEW.raw_user_meta_data->>'role' = 'admin') THEN
      INSERT INTO admins (profile_id, permissions, active)
      VALUES (
        NEW.id,
        ARRAY['dashboard', 'patients', 'providers', 'assignments'],
        true
      );
      RAISE LOG 'Admin record created for user: %', NEW.id;
      
    ELSIF (NEW.raw_user_meta_data->>'role' = 'provider') THEN
      INSERT INTO providers (profile_id, specialty, license_number, phone, active)
      VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Practice'),
        COALESCE(NEW.raw_user_meta_data->>'license_number', 'PENDING'),
        NEW.raw_user_meta_data->>'phone',
        true
      );
      RAISE LOG 'Provider record created for user: %', NEW.id;
    END IF;
  EXCEPTION 
    WHEN unique_violation THEN
      RAISE LOG 'Role record already exists for user: %, skipping', NEW.id;
    WHEN OTHERS THEN
      RAISE LOG 'Error creating role record for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
      RAISE; -- Re-raise the error to fail the signup
  END;
  
  RAISE LOG 'handle_new_user completed successfully for user: %', NEW.id;
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Critical error in handle_new_user trigger for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
    -- Re-raise the error to prevent incomplete user creation
    RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- The trigger is already created, so we don't need to recreate it
-- This will just replace the function implementation

COMMENT ON FUNCTION handle_new_user() IS 'Enhanced auth user creation trigger with improved error handling and logging';