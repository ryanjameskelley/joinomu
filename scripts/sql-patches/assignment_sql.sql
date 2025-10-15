-- SQL to run in Supabase Dashboard (bypasses RLS)
-- This creates a provider record and patient record for the auth users, then assigns them

-- 1. Create provider record for the authenticated user
INSERT INTO providers (user_id, first_name, last_name, email, created_at, updated_at)
VALUES (
  '9bc6ae5e-d528-411b-975a-b2346519dbb5',
  'Dr. Test',
  'Provider',
  'testprovider@example.com',
  NOW(),
  NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 2. Create patient record for Ryan
INSERT INTO patients (email, first_name, last_name, created_at, updated_at)
VALUES (
  'ryan@ryankelleydesign.com',
  'Ryan',
  'Kelley',
  NOW(),
  NOW()
) ON CONFLICT (email) DO NOTHING;

-- 3. Get the IDs (for verification)
SELECT 'Provider ID:' as label, id, first_name, last_name 
FROM providers 
WHERE user_id = '9bc6ae5e-d528-411b-975a-b2346519dbb5'

UNION ALL

SELECT 'Patient ID:' as label, id, first_name, last_name 
FROM patients 
WHERE email = 'ryan@ryankelleydesign.com';

-- 4. Create the assignment
INSERT INTO patient_providers (patient_id, provider_id, treatment_type, is_primary, assigned_date)
SELECT 
  p.id as patient_id,
  pr.id as provider_id,
  'weight_loss' as treatment_type,
  true as is_primary,
  CURRENT_DATE as assigned_date
FROM patients p, providers pr
WHERE p.email = 'ryan@ryankelleydesign.com'
  AND pr.user_id = '9bc6ae5e-d528-411b-975a-b2346519dbb5'
  AND NOT EXISTS (
    SELECT 1 FROM patient_providers pp 
    WHERE pp.patient_id = p.id AND pp.provider_id = pr.id
  );

-- 5. Verify the assignment
SELECT 
  pp.*,
  p.first_name || ' ' || p.last_name as patient_name,
  p.email as patient_email,
  pr.first_name || ' ' || pr.last_name as provider_name
FROM patient_providers pp
JOIN patients p ON pp.patient_id = p.id
JOIN providers pr ON pp.provider_id = pr.id
WHERE pr.user_id = '9bc6ae5e-d528-411b-975a-b2346519dbb5';