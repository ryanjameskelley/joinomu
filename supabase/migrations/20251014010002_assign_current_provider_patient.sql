-- Assign current provider to patient
-- Provider: profile_id 'ccabc2d7-037e-4410-ae15-8ad673f0f7e1'
-- Patient: profile_id '6a2ffaa8-318b-4888-a102-1277708d6b9a'

-- Step 1: Find the provider and patient IDs and insert the assignment
WITH provider_lookup AS (
  SELECT id as provider_id FROM providers
  WHERE profile_id = 'ccabc2d7-037e-4410-ae15-8ad673f0f7e1'
),
patient_lookup AS (
  SELECT id as patient_id FROM patients
  WHERE profile_id = '6a2ffaa8-318b-4888-a102-1277708d6b9a'
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
WHERE p.provider_id IS NOT NULL AND pt.patient_id IS NOT NULL;

-- Step 3: Verify it was created and output results
DO $$
DECLARE
    assignment_count integer;
BEGIN
    SELECT COUNT(*) INTO assignment_count
    FROM patient_assignments pa
    JOIN patients p ON pa.patient_id = p.id
    JOIN providers pr ON pa.provider_id = pr.id
    WHERE p.profile_id = '6a2ffaa8-318b-4888-a102-1277708d6b9a'
      AND pr.profile_id = 'ccabc2d7-037e-4410-ae15-8ad673f0f7e1';
      
    IF assignment_count > 0 THEN
        RAISE NOTICE '✅ SUCCESS: Provider-Patient assignment created successfully!';
        RAISE NOTICE 'Assignments found: %', assignment_count;
    ELSE
        RAISE WARNING '❌ FAILED: No assignment was created. Check that both provider and patient exist.';
    END IF;
END $$;