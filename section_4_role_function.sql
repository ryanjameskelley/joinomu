-- ===========================================
-- SECTION 4: Role Detection Function
-- ===========================================

-- Role detection function to work with proper RLS
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS '
DECLARE
  roles_array TEXT[] := ''{}''::TEXT[];
  primary_role TEXT := NULL;
  result JSON;
BEGIN
  -- Check if user is a patient
  IF EXISTS (SELECT 1 FROM patients WHERE user_id = user_uuid) THEN
    roles_array := array_append(roles_array, ''patient'');
    IF primary_role IS NULL THEN
      primary_role := ''patient'';
    END IF;
  END IF;
  
  -- Check if user is a provider
  IF EXISTS (SELECT 1 FROM providers WHERE user_id = user_uuid) THEN
    roles_array := array_append(roles_array, ''provider'');
    IF primary_role IS NULL THEN
      primary_role := ''provider'';
    END IF;
  END IF;
  
  -- Check if user is an admin
  IF EXISTS (SELECT 1 FROM admins WHERE user_id = user_uuid) THEN
    roles_array := array_append(roles_array, ''admin'');
    IF primary_role IS NULL THEN
      primary_role := ''admin'';
    END IF;
  END IF;
  
  -- Return as JSON
  result := json_build_object(
    ''roles'', to_jsonb(roles_array),
    ''primary_role'', primary_role,
    ''primaryRole'', primary_role
  );
  
  RETURN result;
END;
';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO anon;