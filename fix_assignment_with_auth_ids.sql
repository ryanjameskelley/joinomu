-- First, undo the previous assignment
DELETE FROM public.patient_assignments 
WHERE patient_id = 'ed86babf-e6fc-4fb0-b0ec-3e11ad6be97c' 
  AND provider_id = '2b66f207-2ae5-442b-8911-ada9c96779cb';

-- Now find the correct patient and provider IDs using the auth IDs you provided
-- Provider auth ID: f071d913-6faa-4d8a-baee-9215992408b5
-- Patient auth ID: 63f32a86-6e57-4728-a254-df0f14987d68

SELECT 'Looking up Provider' as lookup_type,
       p.id as provider_table_id, 
       p.profile_id as auth_profile_id,
       prof.first_name || ' ' || prof.last_name as provider_name
FROM public.providers p
JOIN public.profiles prof ON p.profile_id = prof.id
WHERE prof.id = 'f071d913-6faa-4d8a-baee-9215992408b5';

SELECT 'Looking up Patient' as lookup_type,
       pt.id as patient_table_id, 
       pt.profile_id as auth_profile_id,
       prof.first_name || ' ' || prof.last_name as patient_name
FROM public.patients pt
JOIN public.profiles prof ON pt.profile_id = prof.id
WHERE prof.id = '63f32a86-6e57-4728-a254-df0f14987d68';

-- Create assignment using the auth IDs to find the correct table IDs
WITH provider_lookup AS (
    SELECT p.id as provider_id
    FROM public.providers p
    WHERE p.profile_id = 'f071d913-6faa-4d8a-baee-9215992408b5'
),
patient_lookup AS (
    SELECT pt.id as patient_id
    FROM public.patients pt
    WHERE pt.profile_id = '63f32a86-6e57-4728-a254-df0f14987d68'
)
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
    pl.patient_id,
    pr.provider_id,
    'weight_loss',
    true,
    NOW(),
    true,
    NOW(),
    NOW()
FROM patient_lookup pl, provider_lookup pr;

-- Verify the assignment was created with the correct auth IDs
SELECT 
    'Final Assignment Verification' as check_type,
    pa.id as assignment_id,
    pa.patient_id,
    pa.provider_id,
    pa.treatment_type,
    pa.is_primary,
    pa.active,
    pp.first_name || ' ' || pp.last_name as patient_name,
    pp.id as patient_auth_id,
    prp.first_name || ' ' || prp.last_name as provider_name,
    prp.id as provider_auth_id
FROM public.patient_assignments pa
JOIN public.patients pat ON pa.patient_id = pat.id
JOIN public.profiles pp ON pat.profile_id = pp.id
JOIN public.providers prov ON pa.provider_id = prov.id  
JOIN public.profiles prp ON prov.profile_id = prp.id
WHERE pp.id = '63f32a86-6e57-4728-a254-df0f14987d68'
  AND prp.id = 'f071d913-6faa-4d8a-baee-9215992408b5';