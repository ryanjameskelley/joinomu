-- Verify the provider assignment
SELECT 
    p.id as patient_id,
    p.profile_id as patient_profile_id,
    p.assigned_provider_id,
    pr.id as provider_id,
    pr.profile_id as provider_profile_id,
    pr.first_name || ' ' || pr.last_name as provider_name
FROM patients p
LEFT JOIN providers pr ON p.assigned_provider_id = pr.id
WHERE p.id = 'f20f48ca-be1e-43b0-95fd-20d385c38bc7';