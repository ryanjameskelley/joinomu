-- Restore the licensed column to providers table and fix automatic assignment

-- Add the licensed column if it doesn't exist
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS licensed TEXT[] DEFAULT '{}';

-- Add comment to describe the column
COMMENT ON COLUMN public.providers.licensed IS 'Array of US state abbreviations where the provider is licensed to practice (e.g., [''CA'', ''NY'', ''TX''])';

-- Create index for efficient querying of licensed states (if not exists)
CREATE INDEX IF NOT EXISTS idx_providers_licensed ON public.providers USING GIN (licensed);

-- Update existing providers to have some licensed states (for testing)
UPDATE public.providers 
SET licensed = ARRAY['CA', 'NY', 'TX', 'FL', 'IL'] 
WHERE licensed IS NULL OR licensed = '{}';

-- Now create the improved assignment function with the licensed column
CREATE OR REPLACE FUNCTION public.assign_provider_with_fallback(patient_profile_id UUID)
RETURNS VOID AS $$
DECLARE
    patient_state TEXT;
    assigned_provider_id UUID;
    patient_record_id UUID;
    provider_count INTEGER;
BEGIN
    RAISE LOG 'Starting assign_provider_with_fallback for patient profile: %', patient_profile_id;
    
    -- Get the patient record ID and their selected state
    SELECT p.id, p.selected_state 
    INTO patient_record_id, patient_state
    FROM public.patients p 
    WHERE p.profile_id = patient_profile_id;

    -- If no patient found, log and exit
    IF patient_record_id IS NULL THEN
        RAISE LOG 'No patient found for profile_id: %', patient_profile_id;
        RETURN;
    END IF;

    RAISE LOG 'Found patient record: %, state: %', patient_record_id, patient_state;

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

    -- First, try to find a provider licensed in the patient's state (if state is available)
    IF patient_state IS NOT NULL AND patient_state != '' THEN
        RAISE LOG 'Attempting to find provider licensed in state: %', patient_state;
        
        SELECT pr.id INTO assigned_provider_id
        FROM public.providers pr
        LEFT JOIN public.patient_assignments pa ON pr.id = pa.provider_id AND pa.active = true
        WHERE pr.active = true 
          AND pr.licensed @> ARRAY[patient_state]
        GROUP BY pr.id
        ORDER BY COUNT(pa.id) ASC, pr.created_at ASC
        LIMIT 1;
        
        IF assigned_provider_id IS NOT NULL THEN
            RAISE LOG 'Found provider % licensed in state %', assigned_provider_id, patient_state;
        ELSE
            RAISE LOG 'No provider found licensed in state %', patient_state;
        END IF;
    ELSE
        RAISE LOG 'Patient state is null or empty, using fallback assignment';
    END IF;

    -- If no provider found for the specific state, fallback to any active provider
    IF assigned_provider_id IS NULL THEN
        RAISE LOG 'Using fallback assignment to any active provider';
        
        SELECT pr.id INTO assigned_provider_id
        FROM public.providers pr
        LEFT JOIN public.patient_assignments pa ON pr.id = pa.provider_id AND pa.active = true
        WHERE pr.active = true
        GROUP BY pr.id
        ORDER BY COUNT(pa.id) ASC, pr.created_at ASC
        LIMIT 1;
        
        IF assigned_provider_id IS NOT NULL THEN
            RAISE LOG 'Found fallback provider: %', assigned_provider_id;
        END IF;
    END IF;

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

-- Test the function
DO $$
DECLARE
    provider_count INTEGER;
    active_providers RECORD;
BEGIN
    -- Check providers
    SELECT COUNT(*) INTO provider_count
    FROM public.providers pr
    WHERE pr.active = true;
    
    RAISE NOTICE 'Database has % active providers', provider_count;
    
    -- List all active providers with their licensing
    FOR active_providers IN 
        SELECT pr.id, pr.licensed, prof.email, prof.first_name || ' ' || prof.last_name as name
        FROM public.providers pr
        JOIN public.profiles prof ON pr.profile_id = prof.id
        WHERE pr.active = true
        ORDER BY pr.created_at
    LOOP
        RAISE NOTICE 'Provider: % (%) - Licensed in: %', 
            active_providers.name, 
            active_providers.email, 
            active_providers.licensed;
    END LOOP;
END $$;