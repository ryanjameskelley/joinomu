-- Create RPC function to manually create admin records (bypasses RLS)
CREATE OR REPLACE FUNCTION create_admin_record(
  user_id_param UUID,
  email_param TEXT,
  first_name_param TEXT DEFAULT 'Admin',
  last_name_param TEXT DEFAULT 'User'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER -- This bypasses RLS
AS $$
DECLARE
  new_id UUID;
  result JSON;
BEGIN
  new_id := gen_random_uuid();
  
  BEGIN
    INSERT INTO admins (id, user_id, email, first_name, last_name, role, permissions, active, created_at, updated_at)
    VALUES (
      new_id,
      user_id_param,
      email_param,
      first_name_param,
      last_name_param,
      'admin',
      ARRAY['messages', 'patients', 'dashboard'],
      true,
      NOW(),
      NOW()
    );
    
    RETURN json_build_object(
      'success', true,
      'admin_id', new_id,
      'message', 'Admin record created successfully'
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
      );
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION create_admin_record(UUID, TEXT, TEXT, TEXT) TO authenticated;

-- Test the function
SELECT 'RPC function created successfully' as status;