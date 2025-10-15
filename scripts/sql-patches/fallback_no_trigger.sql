-- Fallback: Disable Trigger Temporarily
-- Run this if you want to test without the trigger

-- Remove the trigger temporarily
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create a simple RPC function for manual user creation
CREATE OR REPLACE FUNCTION create_user_record(
  user_id_param UUID,
  email_param TEXT,
  first_name_param TEXT,
  last_name_param TEXT,
  role_param TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS '
DECLARE
  new_id uuid;
  result JSON;
BEGIN
  new_id := gen_random_uuid();
  
  BEGIN
    IF role_param = ''patient'' THEN
      INSERT INTO patients (id, user_id, email, first_name, last_name, created_at, updated_at)
      VALUES (new_id, user_id_param, email_param, first_name_param, last_name_param, NOW(), NOW());
      
    ELSIF role_param = ''provider'' THEN
      INSERT INTO providers (id, user_id, email, first_name, last_name, specialty, license_number, created_at, updated_at)
      VALUES (new_id, user_id_param, email_param, first_name_param, last_name_param, ''General Practice'', ''TBD'', NOW(), NOW());
      
    ELSIF role_param = ''admin'' THEN
      INSERT INTO admins (id, user_id, email, first_name, last_name, role, created_at, updated_at)
      VALUES (new_id, user_id_param, email_param, first_name_param, last_name_param, ''admin'', NOW(), NOW());
      
    ELSE
      RETURN json_build_object(''success'', false, ''error'', ''Invalid role'');
    END IF;
    
    RETURN json_build_object(''success'', true, ''id'', new_id);
    
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(''success'', false, ''error'', SQLERRM);
  END;
END;
';

GRANT EXECUTE ON FUNCTION create_user_record(UUID, TEXT, TEXT, TEXT, TEXT) TO authenticated;