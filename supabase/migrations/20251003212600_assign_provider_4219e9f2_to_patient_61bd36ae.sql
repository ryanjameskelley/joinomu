-- Assign provider (uid: 4219e9f2-8349-4c21-ba99-3300fd076787) 
-- to patient (uid: 61bd36ae-a949-4ae3-bc8e-2d05dace9571)

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
FROM provider_lookup p, patient_lookup pt
WHERE NOT EXISTS (
  SELECT 1 FROM patient_assignments pa
  WHERE pa.provider_id = p.provider_id 
    AND pa.patient_id = pt.patient_id
);