-- Step 1: Find the provider and patient IDs
WITH provider_lookup AS (
  SELECT id as provider_id FROM providers
  WHERE profile_id = '305d1547-37d4-4852-8ff0-f63199270616'
),
patient_lookup AS (
  SELECT id as patient_id FROM patients
  WHERE profile_id = 'b095ab96-69c1-4bbd-bf63-8098b530ab69'
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