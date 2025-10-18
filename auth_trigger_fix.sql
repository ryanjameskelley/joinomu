-- Quick fix for auth trigger to resolve patient signup errors
-- Execute this directly in Supabase SQL editor

-- Create the automatic provider assignment function with fallback logic
CREATE OR REPLACE FUNCTION public.assign_provider_with_fallback(patient_profile_id UUID)
RETURNS VOID AS $$
DECLARE
    patient_state TEXT;
    assigned_provider_id UUID;
    patient_record_id UUID;
BEGIN
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

    -- If patient already has an active assignment, skip
    IF EXISTS (
        SELECT 1 FROM public.patient_assignments pa 
        WHERE pa.patient_id = patient_record_id AND pa.active = true
    ) THEN
        RAISE LOG 'Patient % already has an active assignment', patient_record_id;
        RETURN;
    END IF;

    -- First, try to find a provider licensed in the patient's state with the fewest assignments
    IF patient_state IS NOT NULL THEN
        SELECT pr.id INTO assigned_provider_id
        FROM public.providers pr
        LEFT JOIN public.patient_assignments pa ON pr.id = pa.provider_id AND pa.active = true
        WHERE pr.active = true 
          AND pr.licensed @> ARRAY[patient_state]
        GROUP BY pr.id
        ORDER BY COUNT(pa.id) ASC, pr.created_at ASC
        LIMIT 1;
    END IF;

    -- If no provider found for the specific state, fallback to any active provider
    IF assigned_provider_id IS NULL THEN
        RAISE LOG 'No provider found for state %, using fallback assignment', patient_state;
        
        SELECT pr.id INTO assigned_provider_id
        FROM public.providers pr
        LEFT JOIN public.patient_assignments pa ON pr.id = pa.provider_id AND pa.active = true
        WHERE pr.active = true
        GROUP BY pr.id
        ORDER BY COUNT(pa.id) ASC, pr.created_at ASC
        LIMIT 1;
    END IF;

    -- If we found a provider, create the assignment
    IF assigned_provider_id IS NOT NULL THEN
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

        RAISE LOG 'Successfully assigned patient % to provider %', patient_record_id, assigned_provider_id;
    ELSE
        RAISE LOG 'No active providers available for assignment to patient %', patient_record_id;
    END IF;

EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in assign_provider_with_fallback for patient %: % - %', patient_profile_id, SQLSTATE, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the auth trigger to call the automatic provider assignment for new patients
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    first_name TEXT;
    last_name TEXT;
    phone_val TEXT;
    specialty_val TEXT;
    license_number_val TEXT;
    licensed_val TEXT[];
    new_provider_id UUID;
    new_patient_id UUID;
BEGIN
    -- Extract data from raw_user_meta_data only
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    first_name := COALESCE(
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'firstName', 
        'User'
    );
    last_name := COALESCE(
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'lastName', 
        'Unknown'
    );
    phone_val := NEW.raw_user_meta_data->>'phone';
    specialty_val := NEW.raw_user_meta_data->>'specialty';
    license_number_val := COALESCE(
        NEW.raw_user_meta_data->>'license_number',
        NEW.raw_user_meta_data->>'licenseNumber'
    );
    
    -- Extract licensed states array from JSON
    -- Handle both array format and null/empty cases
    IF NEW.raw_user_meta_data ? 'licensed' THEN
        -- Convert JSON array to TEXT array, handle both json and jsonb
        BEGIN
            SELECT ARRAY(
                SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'licensed')
            ) INTO licensed_val;
        EXCEPTION
            WHEN OTHERS THEN
                -- Fallback for regular JSON
                SELECT ARRAY(
                    SELECT json_array_elements_text((NEW.raw_user_meta_data->>'licensed')::json)
                ) INTO licensed_val;
        END;
    ELSE
        licensed_val := '{}'; -- Empty array as default
    END IF;

    -- Create profile first with explicit schema reference
    INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = NOW();

    -- Create role-specific records with explicit schema references
    IF user_role = 'patient' THEN
        INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
        VALUES (NEW.id, phone_val, false, NOW(), NOW())
        ON CONFLICT (profile_id) DO UPDATE SET
            phone = EXCLUDED.phone,
            updated_at = NOW()
        RETURNING id INTO new_patient_id;

        -- Automatically assign the new patient to a provider
        PERFORM public.assign_provider_with_fallback(NEW.id);

    ELSIF user_role = 'provider' THEN
        -- Create provider record with licensed states and capture the ID for schedule creation
        INSERT INTO public.providers (profile_id, specialty, license_number, phone, licensed, active, created_at, updated_at)
        VALUES (NEW.id, specialty_val, license_number_val, phone_val, licensed_val, true, NOW(), NOW())
        ON CONFLICT (profile_id) DO UPDATE SET
            specialty = EXCLUDED.specialty,
            license_number = EXCLUDED.license_number,
            phone = EXCLUDED.phone,
            licensed = EXCLUDED.licensed,
            updated_at = NOW()
        RETURNING id INTO new_provider_id;

        -- Create default provider schedule (Monday-Friday, 9 AM - 5 PM) if not exists
        INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, treatment_types, active, created_at, updated_at)
        VALUES
            (new_provider_id, 1, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 2, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 3, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 4, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 5, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW())
        ON CONFLICT (provider_id, day_of_week) DO NOTHING;

    ELSIF user_role = 'admin' THEN
        INSERT INTO public.admins (profile_id, permissions, active, created_at, updated_at)
        VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true, NOW(), NOW())
        ON CONFLICT (profile_id) DO UPDATE SET
            permissions = EXCLUDED.permissions,
            updated_at = NOW();
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.assign_provider_with_fallback(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.assign_provider_with_fallback(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.assign_provider_with_fallback(UUID) TO service_role;