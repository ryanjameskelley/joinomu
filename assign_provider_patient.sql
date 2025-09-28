-- Assign provider 48765ae2-e518-4135-b1f4-48ec589bf489 as weight loss provider 
-- for patient bf29b246-0d38-4701-a7f3-0fe0cfd2d81b

INSERT INTO patient_provider_assignments (
  patient_id, 
  provider_id, 
  treatment_type, 
  is_primary, 
  assigned_date, 
  assignment_status
) VALUES (
  'bf29b246-0d38-4701-a7f3-0fe0cfd2d81b',
  '48765ae2-e518-4135-b1f4-48ec589bf489', 
  'weight_loss',
  true,
  CURRENT_DATE,
  'active'
) ON CONFLICT (patient_id, provider_id) 
DO UPDATE SET 
  treatment_type = 'weight_loss',
  is_primary = true,
  assignment_status = 'active',
  assigned_date = CURRENT_DATE;