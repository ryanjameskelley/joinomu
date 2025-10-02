-- Create a migration file to assign provider to patient
-- This will be run as part of the database reset process

-- Provider user_id: b0fe1e12-3dce-4952-bfee-b374d85fd485
-- Patient profile_id: 0e00dc93-9582-44b6-9803-f1ba893902eb

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
WHERE p.profile_id = 'b0fe1e12-3dce-4952-bfee-b374d85fd485'
  AND pt.profile_id = '0e00dc93-9582-44b6-9803-f1ba893902eb'
  AND NOT EXISTS (
    SELECT 1 FROM patient_assignments pa
    WHERE pa.provider_id = p.id 
      AND pa.patient_id = pt.id 
      AND pa.active = true
  );