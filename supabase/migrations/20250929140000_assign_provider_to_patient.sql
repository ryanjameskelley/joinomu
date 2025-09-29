-- Assign provider e5c97bac-2fd3-44ef-b93c-fd06773a0186 to patient 42c555b4-a76b-484a-846d-3e8a36d571d3
-- Using the assign_patient_to_provider RPC function

SELECT assign_patient_to_provider(
  '42c555b4-a76b-484a-846d-3e8a36d571d3'::uuid,  -- patient_id
  'e5c97bac-2fd3-44ef-b93c-fd06773a0186'::uuid,  -- provider_id  
  'weight_loss',                                   -- treatment_type
  true                                            -- is_primary
);

-- Verify the assignment was created
SELECT 
  pa.id as assignment_id,
  p.first_name || ' ' || p.last_name as patient_name,
  pr.first_name || ' ' || pr.last_name as provider_name,
  pa.treatment_type,
  pa.is_primary
FROM patient_assignments pa
JOIN patients pt ON pa.patient_id = pt.id  
JOIN profiles p ON pt.profile_id = p.id
JOIN providers prov ON pa.provider_id = prov.id
JOIN profiles pr ON prov.profile_id = pr.id
WHERE pa.patient_id = '42c555b4-a76b-484a-846d-3e8a36d571d3'::uuid
  AND pa.provider_id = 'e5c97bac-2fd3-44ef-b93c-fd06773a0186'::uuid;