// Apply RPC function directly via Supabase client
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const supabaseUrl = 'https://ukyczgfoqhdbamxycrkn.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVreWN6Z2ZvcWhkYmFteHljcmtuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NTEzNTA2MCwiZXhwIjoyMDcwNzExMDYwfQ.iJOV8FJCf0vp3kO9cPjy5Qa1vFQF-0RjdkCL9J7aKy8'

const supabase = createClient(supabaseUrl, supabaseKey)

async function applyRPCFunction() {
  const sql = `
-- Create RPC function to manually create admin records (bypasses RLS)
CREATE OR REPLACE FUNCTION create_admin_record(
  user_id_param UUID,
  email_param TEXT,
  first_name_param TEXT DEFAULT 'Admin',
  last_name_param TEXT DEFAULT 'User'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
$function$;

GRANT EXECUTE ON FUNCTION create_admin_record(UUID, TEXT, TEXT, TEXT) TO authenticated;
`

  try {
    const { error } = await supabase.rpc('exec_sql', { sql })
    if (error) {
      console.error('Error creating RPC function:', error)
    } else {
      console.log('RPC function created successfully')
    }
  } catch (err) {
    console.error('Failed to execute SQL:', err)
  }
}

applyRPCFunction()