-- Assign provider user_id 0b1b7d2e-7dc3-49dc-9806-6576bd36cbac to patient user_id 1f43e557-998d-44ac-bc3b-910b94052691

INSERT INTO patient_assignments (
    provider_id,
    patient_id,
    treatment_type,
    is_primary,
    active,
    assigned_date
)
SELECT 
    p.id as provider_id,
    pt.id as patient_id,
    'weight_loss' as treatment_type,
    true as is_primary,
    true as active,
    NOW() as assigned_date
FROM providers p
CROSS JOIN patients pt
WHERE p.user_id = '0b1b7d2e-7dc3-49dc-9806-6576bd36cbac'
  AND pt.profile_id = '1f43e557-998d-44ac-bc3b-910b94052691'
  AND NOT EXISTS (
    SELECT 1 FROM patient_assignments pa
    WHERE pa.provider_id = p.id 
      AND pa.patient_id = pt.id 
      AND pa.active = true
  );

-- Verify the assignment was created
SELECT 
    pa.id as assignment_id,
    p.first_name || ' ' || p.last_name as provider_name,
    pt.first_name || ' ' || pt.last_name as patient_name,
    pa.treatment_type,
    pa.assigned_date
FROM patient_assignments pa
JOIN providers p ON pa.provider_id = p.id
JOIN patients pt ON pa.patient_id = pt.id
WHERE p.user_id = '0b1b7d2e-7dc3-49dc-9806-6576bd36cbac'
  AND pt.profile_id = '1f43e557-998d-44ac-bc3b-910b94052691'
  AND pa.active = true;