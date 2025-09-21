-- Create RPC function to detect user roles (bypasses RLS)
CREATE OR REPLACE FUNCTION get_user_roles_secure(user_id_param UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
AS $$
DECLARE
  roles_array TEXT[] := '{}';
  primary_role TEXT := NULL;
BEGIN
  -- Check if user is an admin
  IF EXISTS (SELECT 1 FROM admins WHERE user_id = user_id_param) THEN
    roles_array := array_append(roles_array, 'admin');
    primary_role := 'admin';
  END IF;
  
  -- Check if user is a provider
  IF EXISTS (SELECT 1 FROM providers WHERE user_id = user_id_param) THEN
    roles_array := array_append(roles_array, 'provider');
    IF primary_role IS NULL THEN
      primary_role := 'provider';
    END IF;
  END IF;
  
  -- Check if user is a patient
  IF EXISTS (SELECT 1 FROM patients WHERE user_id = user_id_param) THEN
    roles_array := array_append(roles_array, 'patient');
    IF primary_role IS NULL THEN
      primary_role := 'patient';
    END IF;
  END IF;
  
  RETURN json_build_object(
    'roles', roles_array,
    'primary_role', primary_role,
    'primaryRole', primary_role  -- For backwards compatibility
  );
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_roles_secure(UUID) TO authenticated;