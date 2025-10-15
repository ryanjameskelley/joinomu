-- Provider-Patient Assignment Script Template
-- Usage: Replace the profile_id values with actual auth UIDs from your app
-- 
-- To find profile_ids:
-- 1. Check browser console for auth.uid() when logged in as provider/patient
-- 2. Or run: SELECT profile_id, id FROM providers; SELECT profile_id, id FROM patients;

-- REPLACE THESE VALUES:
-- Provider profile_id (auth.uid() when provider is logged in)
-- Patient profile_id (auth.uid() when patient is logged in)

WITH provider_lookup AS (
  SELECT id as provider_id FROM providers
  WHERE profile_id = 'REPLACE_WITH_PROVIDER_AUTH_UID'
),
patient_lookup AS (
  SELECT id as patient_id FROM patients  
  WHERE profile_id = 'REPLACE_WITH_PATIENT_AUTH_UID'
)
-- Insert the assignment (prevents duplicates)
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
WHERE p.provider_id IS NOT NULL 
  AND pt.patient_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM patient_assignments pa
    WHERE pa.provider_id = p.provider_id 
    AND pa.patient_id = pt.patient_id
  );

-- Verify the assignment was created
DO $$
DECLARE
    assignment_count integer;
    provider_exists boolean;
    patient_exists boolean;
BEGIN
    -- Check if provider exists
    SELECT EXISTS(SELECT 1 FROM providers WHERE profile_id = 'REPLACE_WITH_PROVIDER_AUTH_UID') INTO provider_exists;
    SELECT EXISTS(SELECT 1 FROM patients WHERE profile_id = 'REPLACE_WITH_PATIENT_AUTH_UID') INTO patient_exists;
    
    RAISE NOTICE '=== ASSIGNMENT STATUS ===';
    RAISE NOTICE 'Provider exists: %', provider_exists;
    RAISE NOTICE 'Patient exists: %', patient_exists;
    
    IF provider_exists AND patient_exists THEN
        SELECT COUNT(*) INTO assignment_count
        FROM patient_assignments pa
        JOIN patients p ON pa.patient_id = p.id
        JOIN providers pr ON pa.provider_id = pr.id
        WHERE p.profile_id = 'REPLACE_WITH_PATIENT_AUTH_UID'
          AND pr.profile_id = 'REPLACE_WITH_PROVIDER_AUTH_UID';
          
        IF assignment_count > 0 THEN
            RAISE NOTICE '✅ SUCCESS: Provider-Patient assignment created!';
            RAISE NOTICE 'Active assignments: %', assignment_count;
        ELSE
            RAISE WARNING '❌ FAILED: Assignment was not created';
        END IF;
    ELSE
        RAISE WARNING '❌ FAILED: Missing provider or patient records';
        IF NOT provider_exists THEN
            RAISE WARNING '   Provider with profile_id REPLACE_WITH_PROVIDER_AUTH_UID not found';
        END IF;
        IF NOT patient_exists THEN
            RAISE WARNING '   Patient with profile_id REPLACE_WITH_PATIENT_AUTH_UID not found';
        END IF;
    END IF;
END $$;