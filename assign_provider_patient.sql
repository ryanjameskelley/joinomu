-- Assignment Script: Provider to Patient
-- Provider profile_id: 63eb8f74-bb1b-47a7-a241-6d5d86c544c8
-- Patient profile_id: 2aacf4bb-11d4-4eb2-8c78-6969e367c742

-- Step 1: Find the provider and patient IDs
WITH provider_lookup AS (
  SELECT id as provider_id FROM providers
  WHERE profile_id = '63eb8f74-bb1b-47a7-a241-6d5d86c544c8'
),
patient_lookup AS (
  SELECT id as patient_id FROM patients
  WHERE profile_id = '2aacf4bb-11d4-4eb2-8c78-6969e367c742'
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

-- Step 3: Verify the assignment
SELECT 
  pa.id as assignment_id,
  pa.provider_id,
  pa.patient_id,
  pa.treatment_type,
  pa.is_primary,
  pa.active,
  pa.assigned_date,
  pr.first_name || ' ' || pr.last_name as provider_name,
  pt.profile_id as patient_profile_id
FROM patient_assignments pa
JOIN providers pr ON pa.provider_id = pr.id
JOIN patients pt ON pa.patient_id = pt.id
WHERE pa.provider_id IN (
  SELECT id FROM providers WHERE profile_id = '63eb8f74-bb1b-47a7-a241-6d5d86c544c8'
)
AND pa.patient_id IN (
  SELECT id FROM patients WHERE profile_id = '2aacf4bb-11d4-4eb2-8c78-6969e367c742'
);