-- Step 1: Find the provider and patient IDs
WITH provider_lookup AS (
  SELECT id as provider_id FROM providers 
  WHERE profile_id = '4219e9f2-8349-4c21-ba99-3300fd076787'
),
patient_lookup AS (
  SELECT id as patient_id FROM patients 
  WHERE profile_id = '61bd36ae-a949-4ae3-bc8e-2d05dace9571'
)
-- Step 2: Insert the assignment
INSERT INTO patient_assignments (
  provider_id,
  patient_id,
  treatment_type,
  is_primary,
  active,
  assigned_date
)
SELECT 
  p.provider_id,
  pt.patient_id,
  'weight_loss',
  true,
  true,
  NOW()
FROM provider_lookup p, patient_lookup pt;

-- Step 3: Verify it was created
SELECT 
  pa.id as assignment_id,
  pa.active,
  pa.assigned_date,
  pa.treatment_type,
  pa.provider_id,
  pa.patient_id
FROM patient_assignments pa
JOIN patients p ON pa.patient_id = p.id
JOIN providers pr ON pa.provider_id = pr.id
WHERE p.profile_id = '61bd36ae-a949-4ae3-bc8e-2d05dace9571'
  AND pr.profile_id = '4219e9f2-8349-4c21-ba99-3300fd076787';