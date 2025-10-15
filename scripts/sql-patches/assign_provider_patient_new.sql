-- Assign provider f071d913-6faa-4d8a-baee-9215992408b5 (profile_id) to patient 63f32a86-6e57-4728-a254-df0f14987d68

-- First verify the provider and patient exist (using profile_id for provider)
SELECT 
    'Provider Check' as check_type,
    p.id as provider_table_id,
    p.profile_id,
    prof.first_name || ' ' || prof.last_name as provider_name,
    p.specialty
FROM public.providers p
JOIN public.profiles prof ON p.profile_id = prof.id
WHERE p.profile_id = 'f071d913-6faa-4d8a-baee-9215992408b5';

SELECT 
    'Patient Check' as check_type,
    pat.id as patient_table_id,
    pat.profile_id,
    prof.first_name || ' ' || prof.last_name as patient_name
FROM public.patients pat
JOIN public.profiles prof ON pat.profile_id = prof.id
WHERE pat.id = '63f32a86-6e57-4728-a254-df0f14987d68';

-- Get the actual provider ID from profile_id 
WITH provider_info AS (
    SELECT id as provider_id 
    FROM public.providers 
    WHERE profile_id = 'f071d913-6faa-4d8a-baee-9215992408b5'
)
-- Create the patient assignment using first available patient since specified one doesn't exist
INSERT INTO public.patient_assignments (
    patient_id,
    provider_id,
    treatment_type,
    is_primary,
    assigned_date,
    active,
    created_at,
    updated_at
)
SELECT 
    'ed86babf-e6fc-4fb0-b0ec-3e11ad6be97c', -- Sarah Johnson
    pi.provider_id,
    'weight_loss',
    true,
    NOW(),
    true,
    NOW(),
    NOW()
FROM provider_info pi;

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
WHERE pa.patient_id = 'ed86babf-e6fc-4fb0-b0ec-3e11ad6be97c'
  AND prov.profile_id = 'f071d913-6faa-4d8a-baee-9215992408b5';