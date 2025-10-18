-- Debug automatic provider assignment issue
-- Check patient data and provider availability

-- Check if the patient exists and has state data
SELECT 
    'Patient Data' as check_type,
    p.id as patient_id,
    p.profile_id,
    p.selected_state,
    p.has_completed_intake,
    prof.email,
    prof.first_name,
    prof.last_name
FROM patients p 
JOIN profiles prof ON p.profile_id = prof.id 
WHERE prof.email = 'patientexample@test.com'
ORDER BY p.created_at DESC
LIMIT 1;

-- Check available providers and their licensing
SELECT 
    'Provider Data' as check_type,
    pr.id as provider_id,
    pr.profile_id,
    pr.licensed,
    pr.active,
    prof.email,
    prof.first_name || ' ' || prof.last_name as provider_name
FROM providers pr
JOIN profiles prof ON pr.profile_id = prof.id
WHERE pr.active = true;

-- Check existing patient assignments
SELECT 
    'Assignment Data' as check_type,
    pa.id,
    pa.patient_id,
    pa.provider_id,
    pa.active,
    pa.treatment_type,
    pa.assigned_date,
    pat_prof.email as patient_email,
    prov_prof.email as provider_email
FROM patient_assignments pa
JOIN patients pt ON pa.patient_id = pt.id
JOIN profiles pat_prof ON pt.profile_id = pat_prof.id
JOIN providers pr ON pa.provider_id = pr.id
JOIN profiles prov_prof ON pr.profile_id = prov_prof.id
WHERE pat_prof.email = 'patientexample@test.com';

-- Test the assignment function manually for the current patient
DO $$
DECLARE
    patient_profile_uuid UUID;
    patient_record_id UUID;
    patient_state TEXT;
BEGIN
    -- Get the patient profile ID
    SELECT prof.id INTO patient_profile_uuid
    FROM profiles prof
    WHERE prof.email = 'patientexample@test.com'
    ORDER BY prof.created_at DESC
    LIMIT 1;
    
    IF patient_profile_uuid IS NOT NULL THEN
        RAISE NOTICE 'Found patient profile: %', patient_profile_uuid;
        
        -- Try to call the assignment function manually
        PERFORM public.assign_provider_with_fallback(patient_profile_uuid);
        
        RAISE NOTICE 'Assignment function called successfully';
    ELSE
        RAISE NOTICE 'No patient found with email patientexample@test.com';
    END IF;
END $$;