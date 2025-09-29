-- Assign provider acb24622-6128-46e7-a61f-a2e7961d8155 to patient afb681f1-a5d2-4c8a-bc82-822a929b70b8

-- First verify the provider and patient exist
SELECT 
    'Provider Check' as check_type,
    p.id as provider_table_id,
    p.profile_id,
    prof.first_name || ' ' || prof.last_name as provider_name,
    p.specialty
FROM public.providers p
JOIN public.profiles prof ON p.profile_id = prof.id
WHERE p.id = 'acb24622-6128-46e7-a61f-a2e7961d8155';

SELECT 
    'Patient Check' as check_type,
    pat.id as patient_table_id,
    pat.profile_id,
    prof.first_name || ' ' || prof.last_name as patient_name
FROM public.patients pat
JOIN public.profiles prof ON pat.profile_id = prof.id
WHERE pat.id = 'afb681f1-a5d2-4c8a-bc82-822a929b70b8';

-- Create the patient assignment
INSERT INTO public.patient_assignments (
    patient_id,
    provider_id,
    treatment_type,
    is_primary,
    assigned_date,
    active,
    created_at,
    updated_at
) VALUES (
    'afb681f1-a5d2-4c8a-bc82-822a929b70b8',
    'acb24622-6128-46e7-a61f-a2e7961d8155',
    'weight_loss',
    true,
    NOW(),
    true,
    NOW(),
    NOW()
) ON CONFLICT (patient_id, provider_id, treatment_type) 
DO UPDATE SET 
    active = true,
    updated_at = NOW();

-- Verify the assignment was created
SELECT 
    'Assignment Verification' as check_type,
    pa.id as assignment_id,
    pa.patient_id,
    pa.provider_id,
    pa.treatment_type,
    pa.is_primary,
    pa.active,
    pp.first_name || ' ' || pp.last_name as patient_name,
    prp.first_name || ' ' || prp.last_name as provider_name
FROM public.patient_assignments pa
JOIN public.patients pat ON pa.patient_id = pat.id
JOIN public.profiles pp ON pat.profile_id = pp.id
JOIN public.providers prov ON pa.provider_id = prov.id  
JOIN public.profiles prp ON prov.profile_id = prp.id
WHERE pa.patient_id = 'afb681f1-a5d2-4c8a-bc82-822a929b70b8'
  AND pa.provider_id = 'acb24622-6128-46e7-a61f-a2e7961d8155';
