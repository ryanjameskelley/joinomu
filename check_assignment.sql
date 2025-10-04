-- Check if patient assignment exists
-- First trace the patient by auth id
WITH patient_lookup AS (
  SELECT id as patient_id, profile_id 
  FROM patients 
  WHERE profile_id = '4d0899b5-9814-46dc-aace-dfcf046d5587'
),
provider_lookup AS (
  SELECT id as provider_id, profile_id
  FROM providers
  WHERE profile_id = '4c5e8c0c-e391-4ec5-a479-d7ef253894e1'
)
-- Now check if assignment exists
SELECT 
  CASE 
    WHEN COUNT(*) > 0 THEN 'ASSIGNMENT EXISTS'
    ELSE 'NO ASSIGNMENT FOUND'
  END as result,
  COUNT(*) as assignment_count
FROM patient_assignments pa
JOIN patient_lookup p ON pa.patient_id = p.patient_id
JOIN provider_lookup pr ON pa.provider_id = pr.provider_id;