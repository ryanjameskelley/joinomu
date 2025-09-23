-- Script to assign patients to additional providers for testing

-- First, let's see what providers and patients we have
SELECT 'Current Providers:' as info;
SELECT id, email, name FROM providers ORDER BY created_at;

SELECT 'Current Patients:' as info;  
SELECT id, email, name FROM patients ORDER BY created_at;

SELECT 'Current Assignments:' as info;
SELECT 
  ppa.provider_id,
  p.email as provider_email,
  ppa.patient_id,
  pat.email as patient_email
FROM patient_provider_assignments ppa
JOIN providers p ON ppa.provider_id = p.id
JOIN patients pat ON ppa.patient_id = pat.id
ORDER BY p.email;

-- Now let's assign patients to the other providers
-- Get the provider IDs for providers other than the heavily assigned one
DO $$
DECLARE
  provider_1_id INTEGER;
  provider_2_id INTEGER;
  patient_ids INTEGER[];
  patient_id INTEGER;
  i INTEGER := 1;
BEGIN
  -- Get provider IDs (excluding the heavily assigned one)
  SELECT id INTO provider_1_id 
  FROM providers 
  WHERE email NOT LIKE 'provider-test-1758500385268@example.com'
  ORDER BY created_at 
  LIMIT 1;
  
  SELECT id INTO provider_2_id 
  FROM providers 
  WHERE email NOT LIKE 'provider-test-1758500385268@example.com'
  AND id != provider_1_id
  ORDER BY created_at 
  LIMIT 1 OFFSET 1;
  
  -- Get patient IDs
  SELECT ARRAY(SELECT id FROM patients ORDER BY created_at LIMIT 6) INTO patient_ids;
  
  -- Assign first 3 patients to provider_1
  FOREACH patient_id IN ARRAY patient_ids[1:3]
  LOOP
    INSERT INTO patient_provider_assignments (provider_id, patient_id, assigned_date)
    VALUES (provider_1_id, patient_id, CURRENT_DATE)
    ON CONFLICT (provider_id, patient_id) DO NOTHING;
  END LOOP;
  
  -- Assign next 3 patients to provider_2  
  FOREACH patient_id IN ARRAY patient_ids[4:6]
  LOOP
    INSERT INTO patient_provider_assignments (provider_id, patient_id, assigned_date)
    VALUES (provider_2_id, patient_id, CURRENT_DATE)
    ON CONFLICT (provider_id, patient_id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Assigned patients to provider % and provider %', provider_1_id, provider_2_id;
END $$;

-- Verify the assignments
SELECT 'Final Assignment Summary:' as info;
SELECT 
  p.email as provider_email,
  p.name as provider_name,
  COUNT(ppa.patient_id) as assigned_patients
FROM providers p
LEFT JOIN patient_provider_assignments ppa ON p.id = ppa.provider_id
GROUP BY p.id, p.email, p.name
ORDER BY p.email;

-- Show detailed assignments
SELECT 'Detailed Assignments:' as info;
SELECT 
  p.email as provider_email,
  pat.email as patient_email,
  pat.name as patient_name,
  ppa.assigned_date
FROM patient_provider_assignments ppa
JOIN providers p ON ppa.provider_id = p.id
JOIN patients pat ON ppa.patient_id = pat.id
ORDER BY p.email, pat.email;