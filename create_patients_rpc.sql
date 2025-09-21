-- Create RPC function to create patient records bypassing RLS
-- Run this in Supabase Dashboard → SQL Editor

CREATE OR REPLACE FUNCTION create_missing_patients()
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  patient_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Create Ryan as a patient
  INSERT INTO patients (id, user_id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    'c08004fd-1b9b-4eda-9fb2-28e3e272a561'::UUID,
    '9bc6ae5e-d528-411b-975a-b2346519dbb5'::UUID,
    'ryan@ryankelleydesign.com',
    'Ryan',
    'Kelley',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();
  
  RETURN QUERY SELECT TRUE, 'Created Ryan patient', 'c08004fd-1b9b-4eda-9fb2-28e3e272a561'::UUID;

  -- Create test patient 1
  INSERT INTO patients (id, user_id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    '7b76db36-47cb-4ca2-acdd-c262f52919e2'::UUID,
    gen_random_uuid(),
    'patient1@example.com',
    'Test',
    'Patient1',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();
  
  RETURN QUERY SELECT TRUE, 'Created Test Patient1', '7b76db36-47cb-4ca2-acdd-c262f52919e2'::UUID;

  -- Create test patient 2
  INSERT INTO patients (id, user_id, email, first_name, last_name, created_at, updated_at)
  VALUES (
    '66ac7329-b5f2-480b-ae4d-5767442e3df2'::UUID,
    gen_random_uuid(),
    'patient2@example.com',
    'Test',
    'Patient2',
    NOW(),
    NOW()
  ) ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    email = EXCLUDED.email,
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    updated_at = NOW();
  
  RETURN QUERY SELECT TRUE, 'Created Test Patient2', '66ac7329-b5f2-480b-ae4d-5767442e3df2'::UUID;

END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION create_missing_patients() TO authenticated;
GRANT EXECUTE ON FUNCTION create_missing_patients() TO anon;