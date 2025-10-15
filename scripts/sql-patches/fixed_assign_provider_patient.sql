-- Assignment Script: Provider to Patient (Fixed)
-- Provider profile_id: 63eb8f74-bb1b-47a7-a241-6d5d86c544c8
-- Patient profile_id: 2aacf4bb-11d4-4eb2-8c78-6969e367c742

-- Step 1: Find the provider and patient IDs and insert assignment
WITH provider_lookup AS (
  SELECT id as provider_id FROM providers
  WHERE profile_id = '63eb8f74-bb1b-47a7-a241-6d5d86c544c8'
),
patient_lookup AS (
  SELECT id as patient_id FROM patients
  WHERE profile_id = '2aacf4bb-11d4-4eb2-8c78-6969e367c742'
)
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