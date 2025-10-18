-- Fix the assign_provider_with_fallback function 
-- Remove dependency on selected_state column that doesn't exist

CREATE OR REPLACE FUNCTION public.assign_provider_with_fallback(patient_profile_id UUID)
RETURNS VOID AS $$
DECLARE
    assigned_provider_id UUID;
    patient_record_id UUID;
    provider_count INTEGER;
BEGIN
    RAISE LOG 'Starting assign_provider_with_fallback for patient profile: %', patient_profile_id;
    
    -- Get the patient record ID (don't try to get selected_state since column doesn't exist)
    SELECT p.id 
    INTO patient_record_id
    FROM public.patients p 
    WHERE p.profile_id = patient_profile_id;

    -- If no patient found, log and exit
    IF patient_record_id IS NULL THEN
        RAISE LOG 'No patient found for profile_id: %', patient_profile_id;
        RETURN;
    END IF;

    RAISE LOG 'Found patient record: %', patient_record_id;

    -- If patient already has an active assignment, skip
    IF EXISTS (
        SELECT 1 FROM public.patient_assignments pa 
        WHERE pa.patient_id = patient_record_id AND pa.active = true
    ) THEN
        RAISE LOG 'Patient % already has an active assignment', patient_record_id;
        RETURN;
    END IF;

    -- Check how many active providers we have
    SELECT COUNT(*) INTO provider_count
    FROM public.providers pr
    WHERE pr.active = true;
    
    RAISE LOG 'Found % active providers', provider_count;

    -- If no active providers, log and exit
    IF provider_count = 0 THEN
        RAISE LOG 'No active providers available for assignment';
        RETURN;
    END IF;

    -- Simply assign to the provider with the fewest active assignments
    -- (Skip state-based assignment since we don't have patient state during signup)
    RAISE LOG 'Finding provider with fewest assignments for fallback assignment';
    
    SELECT pr.id INTO assigned_provider_id
    FROM public.providers pr
    LEFT JOIN public.patient_assignments pa ON pr.id = pa.provider_id AND pa.active = true
    WHERE pr.active = true
    GROUP BY pr.id
    ORDER BY COUNT(pa.id) ASC, pr.created_at ASC
    LIMIT 1;
    
    -- If we found a provider, create the assignment
    IF assigned_provider_id IS NOT NULL THEN
        RAISE LOG 'Creating assignment between patient % and provider %', patient_record_id, assigned_provider_id;
        
        INSERT INTO public.patient_assignments (
            provider_id,
            patient_id,
            treatment_type,
            is_primary,
            active,
            assigned_date,
            created_at,
            updated_at
        ) VALUES (
            assigned_provider_id,
            patient_record_id,
            'weight_loss',
            true,
            true,
            NOW(),
            NOW(),
            NOW()
        );

        RAISE NOTICE 'AUTO-ASSIGNMENT SUCCESS: Patient % assigned to provider %', patient_record_id, assigned_provider_id;
    ELSE
        RAISE WARNING 'AUTO-ASSIGNMENT FAILED: No providers available for patient %', patient_record_id;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in assign_provider_with_fallback for patient %: % - %', patient_profile_id, SQLSTATE, SQLERRM;
        RAISE WARNING 'AUTO-ASSIGNMENT ERROR for patient %: %', patient_profile_id, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the function manually for the current patient
DO $$
DECLARE
    patient_profile_uuid UUID;
BEGIN
    -- Get the most recent patient profile ID
    SELECT prof.id INTO patient_profile_uuid
    FROM profiles prof
    JOIN patients pt ON pt.profile_id = prof.id
    WHERE prof.role = 'patient'
    ORDER BY prof.created_at DESC
    LIMIT 1;
    
    IF patient_profile_uuid IS NOT NULL THEN
        RAISE NOTICE 'Testing assignment for patient: %', patient_profile_uuid;
        PERFORM public.assign_provider_with_fallback(patient_profile_uuid);
    ELSE
        RAISE NOTICE 'No patients found to test assignment';
    END IF;
END $$;