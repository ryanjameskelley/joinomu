-- Verify patient assignment exists in patient_assignments table
SELECT 
    pa.id,
    pa.patient_id,
    pa.provider_id,
    pa.status,
    pa.assigned_at,
    p.profile_id as patient_profile_id,
    pr.profile_id as provider_profile_id,
    pr.first_name || ' ' || pr.last_name as provider_name
FROM patient_assignments pa
JOIN patients p ON pa.patient_id = p.id
JOIN providers pr ON pa.provider_id = pr.id
WHERE pa.patient_id = 'f20f48ca-be1e-43b0-95fd-20d385c38bc7'
  AND pa.provider_id = '6d7b73d5-7872-4519-9fa9-0ec6d2703869';