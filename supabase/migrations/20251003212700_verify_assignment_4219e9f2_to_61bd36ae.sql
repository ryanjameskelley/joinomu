-- Verify the assignment between provider and patient
SELECT 
  pa.id as assignment_id,
  pa.active,
  pa.assigned_date,
  pa.treatment_type,
  pa.provider_id,
  pa.patient_id,
  p.profile_id as patient_profile_id,
  pr.profile_id as provider_profile_id
FROM patient_assignments pa
JOIN patients p ON pa.patient_id = p.id
JOIN providers pr ON pa.provider_id = pr.id
WHERE p.profile_id = '61bd36ae-a949-4ae3-bc8e-2d05dace9571'
  AND pr.profile_id = '4219e9f2-8349-4c21-ba99-3300fd076787';