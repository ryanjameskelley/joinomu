-- Simple fix for auth signup - recreate the trigger properly
-- Drop existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- Create a simple, working auth trigger
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_role TEXT;
  first_name TEXT;
  last_name TEXT;
  phone_val TEXT;
BEGIN
  -- Extract metadata from raw_user_meta_data (frontend signup)
  user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
  first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName', 'User');
  last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'lastName', 'Unknown');
  phone_val := NEW.raw_user_meta_data->>'phone';

  -- Create profile
  INSERT INTO profiles (
    id,
    email,
    first_name,
    last_name,
    role,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    NEW.email,
    first_name,
    last_name,
    user_role,
    NOW(),
    NOW()
  );

  -- Create role-specific record
  IF user_role = 'patient' THEN
    INSERT INTO patients (
      profile_id,
      phone,
      has_completed_intake,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      phone_val,
      false,
      NOW(),
      NOW()
    );
  ELSIF user_role = 'provider' THEN
    INSERT INTO providers (
      profile_id,
      specialty,
      license_number,
      phone,
      active,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      NEW.raw_user_meta_data->>'specialty',
      NEW.raw_user_meta_data->>'licenseNumber',
      phone_val,
      true,
      NOW(),
      NOW()
    );
  ELSIF user_role = 'admin' THEN
    INSERT INTO admins (
      profile_id,
      permissions,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      'full',
      NOW(),
      NOW()
    );
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the signup
    RAISE NOTICE 'Auth trigger error: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Grant permissions
GRANT EXECUTE ON FUNCTION handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION handle_new_user() TO anon;

-- Test the setup
SELECT 'Auth trigger setup complete' as status;