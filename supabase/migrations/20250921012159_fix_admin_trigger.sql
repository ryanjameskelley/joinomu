-- Fix Trigger to Handle All Required Columns
-- Run this in Supabase Dashboard → SQL Editor

-- Drop and recreate the trigger function with proper column handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
AS '
DECLARE
  user_role text;
BEGIN
  -- Get the user role from raw_user_meta_data
  user_role := NEW.raw_user_meta_data->>''role'';
  
  -- Create records based on role
  IF user_role = ''patient'' THEN
    INSERT INTO patients (id, user_id, email, first_name, last_name, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>''first_name'', ''Patient''),
      COALESCE(NEW.raw_user_meta_data->>''last_name'', ''User''),
      NOW(),
      NOW()
    );
  ELSIF user_role = ''provider'' THEN
    INSERT INTO providers (id, user_id, email, first_name, last_name, specialty, license_number, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>''first_name'', ''Provider''),
      COALESCE(NEW.raw_user_meta_data->>''last_name'', ''User''),
      COALESCE(NEW.raw_user_meta_data->>''specialty'', ''General Practice''),
      COALESCE(NEW.raw_user_meta_data->>''license_number'', ''TBD''),
      NOW(),
      NOW()
    );
  ELSIF user_role = ''admin'' THEN
    -- Include all required columns for admins table
    INSERT INTO admins (id, user_id, email, first_name, last_name, role, permissions, active, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>''first_name'', ''Admin''),
      COALESCE(NEW.raw_user_meta_data->>''last_name'', ''User''),
      ''admin'',
      ''{messages,patients,dashboard}'',  -- Default permissions
      ''true'',  -- Active by default
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
';

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Test the function
SELECT 'Fixed trigger function created successfully' as status;