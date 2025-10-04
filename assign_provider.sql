-- Assign provider to patient
UPDATE patients 
SET assigned_provider_id = '6d7b73d5-7872-4519-9fa9-0ec6d2703869'
WHERE id = 'f20f48ca-be1e-43b0-95fd-20d385c38bc7';

-- Verify the assignment
SELECT 
    p.id as patient_id,
    p.profile_id as patient_profile_id,
    p.assigned_provider_id,
    pr.id as provider_id,
    pr.profile_id as provider_profile_id
FROM patients p
LEFT JOIN providers pr ON p.assigned_provider_id = pr.id
WHERE p.id = 'f20f48ca-be1e-43b0-95fd-20d385c38bc7';