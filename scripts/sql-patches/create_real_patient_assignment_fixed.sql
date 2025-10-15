-- Create real patients with user_id and assign to provider
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create Ryan as a patient (using existing patient_id and the logged-in user_id)
INSERT INTO patients (id, user_id, email, first_name, last_name, created_at, updated_at)
VALUES (
  'c08004fd-1b9b-4eda-9fb2-28e3e272a561',  -- Use existing patient_id from relationships
  '9bc6ae5e-d528-411b-975a-b2346519dbb5',  -- Use the same user_id as the provider (for testing)
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

-- 2. Create two more test patients with random UUIDs for user_id
INSERT INTO patients (id, user_id, email, first_name, last_name, created_at, updated_at)
VALUES 
  (
    '7b76db36-47cb-4ca2-acdd-c262f52919e2',
    gen_random_uuid(),  -- Generate random UUID for user_id
    'patient1@example.com',
    'Test',
    'Patient1',
    NOW(),
    NOW()
  ),
  (
    '66ac7329-b5f2-480b-ae4d-5767442e3df2',
    gen_random_uuid(),  -- Generate random UUID for user_id
    'patient2@example.com',
    'Test', 
    'Patient2',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
  user_id = EXCLUDED.user_id,
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();

-- 3. Verify the assignments work now
SELECT 
  pp.treatment_type,
  pp.assigned_date,
  pp.is_primary,
  p.first_name || ' ' || p.last_name as patient_name,
  p.email as patient_email,
  p.user_id
FROM patient_providers pp
JOIN patients p ON pp.patient_id = p.id
WHERE pp.provider_id = '133ad6a8-f330-4d04-8fb5-48e902653bfc';