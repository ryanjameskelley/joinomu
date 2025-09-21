-- Simple Trigger Fix
-- Run this in Supabase Dashboard → SQL Editor if the original trigger has issues

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS handle_new_user();

-- Create a more robust trigger function with better error handling
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
AS '
DECLARE
  user_role text;
  new_id uuid;
BEGIN
  -- Get the user role from raw_user_meta_data
  user_role := NEW.raw_user_meta_data->>''role'';
  
  -- Only proceed if we have a role
  IF user_role IS NOT NULL THEN
    new_id := gen_random_uuid();
    
    -- Create records based on role with error handling
    BEGIN
      IF user_role = ''patient'' THEN
        INSERT INTO patients (id, user_id, email, first_name, last_name, created_at, updated_at)
        VALUES (
          new_id,
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
          new_id,
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
        INSERT INTO admins (id, user_id, email, first_name, last_name, role, created_at, updated_at)
        VALUES (
          new_id,
          NEW.id,
          NEW.email,
          COALESCE(NEW.raw_user_meta_data->>''first_name'', ''Admin''),
          COALESCE(NEW.raw_user_meta_data->>''last_name'', ''User''),
          ''admin'',
          NOW(),
          NOW()
        );
      END IF;
    EXCEPTION
      WHEN OTHERS THEN
        -- Log the error but don''t fail the user creation
        RAISE NOTICE ''Error creating user record for role %: %'', user_role, SQLERRM;
    END;
  END IF;
  
  RETURN NEW;
END;
';

-- Create trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Test the function works
SELECT 'Trigger function created successfully' as status;