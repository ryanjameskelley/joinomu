-- Debug auth trigger to see what data it's receiving
-- Add detailed logging to see where the failure occurs

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
    -- Log raw data being received
    RAISE LOG 'Auth trigger started for user: %', NEW.email;
    RAISE LOG 'Raw metadata: %', NEW.raw_user_meta_data;
    
    -- Extract data from raw_user_meta_data
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    RAISE LOG 'Extracted role: %', user_role;
    
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
    
    RAISE LOG 'Extracted names: % %', first_name, last_name;
    
    phone_val := NEW.raw_user_meta_data->>'phone';
    specialty_val := NEW.raw_user_meta_data->>'specialty';
    license_number_val := COALESCE(
        NEW.raw_user_meta_data->>'license_number',
        NEW.raw_user_meta_data->>'licenseNumber'
    );
    
    RAISE LOG 'Provider data - specialty: %, license: %, phone: %', specialty_val, license_number_val, phone_val;
    
    -- Extract licensed states array from JSON
    IF NEW.raw_user_meta_data ? 'licensed' THEN
        RAISE LOG 'Licensed field exists in metadata';
        RAISE LOG 'Licensed field value: %', NEW.raw_user_meta_data->'licensed';
        RAISE LOG 'Licensed field type: %', pg_typeof(NEW.raw_user_meta_data->'licensed');
        
        BEGIN
            SELECT ARRAY(
                SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'licensed')
            ) INTO licensed_val;
            RAISE LOG 'Successfully extracted licensed array: %', licensed_val;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE LOG 'Failed to extract licensed array: % - %', SQLSTATE, SQLERRM;
                licensed_val := '{}';
        END;
    ELSE
        RAISE LOG 'Licensed field not found in metadata';
        licensed_val := '{}';
    END IF;

    RAISE LOG 'Final licensed value: %', licensed_val;

    -- Create profile first
    RAISE LOG 'Creating profile...';
    INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = NOW();
    RAISE LOG 'Profile created successfully';

    -- Create role-specific records
    IF user_role = 'patient' THEN
        RAISE LOG 'Creating patient record...';
        INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
        VALUES (NEW.id, phone_val, false, NOW(), NOW())
        ON CONFLICT (profile_id) DO UPDATE SET
            phone = EXCLUDED.phone,
            updated_at = NOW()
        RETURNING id INTO new_patient_id;
        RAISE LOG 'Patient created, calling assignment function...';
        PERFORM public.assign_provider_with_fallback(NEW.id);

    ELSIF user_role = 'provider' THEN
        RAISE LOG 'Creating provider record with data: specialty=%, license=%, phone=%, licensed=%', specialty_val, license_number_val, phone_val, licensed_val;
        
        INSERT INTO public.providers (profile_id, specialty, license_number, phone, licensed, active, created_at, updated_at)
        VALUES (NEW.id, specialty_val, license_number_val, phone_val, licensed_val, true, NOW(), NOW())
        ON CONFLICT (profile_id) DO UPDATE SET
            specialty = EXCLUDED.specialty,
            license_number = EXCLUDED.license_number,
            phone = EXCLUDED.phone,
            licensed = EXCLUDED.licensed,
            updated_at = NOW()
        RETURNING id INTO new_provider_id;
        
        RAISE LOG 'Provider created with ID: %', new_provider_id;

        -- Create default provider schedule
        RAISE LOG 'Creating provider schedule...';
        INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, treatment_types, active, created_at, updated_at)
        VALUES
            (new_provider_id, 1, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 2, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 3, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 4, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 5, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW())
        ON CONFLICT (provider_id, day_of_week) DO NOTHING;
        RAISE LOG 'Provider schedule created';

    ELSIF user_role = 'admin' THEN
        RAISE LOG 'Creating admin record...';
        INSERT INTO public.admins (profile_id, permissions, active, created_at, updated_at)
        VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true, NOW(), NOW())
        ON CONFLICT (profile_id) DO UPDATE SET
            permissions = EXCLUDED.permissions,
            updated_at = NOW();
    END IF;

    RAISE LOG 'Auth trigger completed successfully for: %', NEW.email;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'ERROR in auth trigger for user %: % - %', NEW.email, SQLSTATE, SQLERRM;
        RAISE EXCEPTION 'Auth trigger failed: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;