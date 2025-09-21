-- Create a real patient and assign to the provider
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Create Ryan as a patient (using one of the existing patient_provider IDs)
INSERT INTO patients (id, email, first_name, last_name, created_at, updated_at)
VALUES (
  'c08004fd-1b9b-4eda-9fb2-28e3e272a561',  -- Use existing patient_id from relationships
  'ryan@ryankelleydesign.com',
  'Ryan',
  'Kelley',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  updated_at = NOW();

-- 2. Create two more test patients for the other relationships
INSERT INTO patients (id, email, first_name, last_name, created_at, updated_at)
VALUES 
  (
    '7b76db36-47cb-4ca2-acdd-c262f52919e2',
    'patient1@example.com',
    'Test',
    'Patient1',
    NOW(),
    NOW()
  ),
  (
    '66ac7329-b5f2-480b-ae4d-5767442e3df2',
    'patient2@example.com',
    'Test', 
    'Patient2',
    NOW(),
    NOW()
  )
ON CONFLICT (id) DO UPDATE SET
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
  p.email as patient_email
FROM patient_providers pp
JOIN patients p ON pp.patient_id = p.id
WHERE pp.provider_id = '133ad6a8-f330-4d04-8fb5-48e902653bfc';