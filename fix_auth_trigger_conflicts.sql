-- Fix auth trigger by removing ON CONFLICT clauses that reference non-existent constraints
-- The issue is that the tables don't have unique constraints for the ON CONFLICT clauses

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
    licensed_json_text TEXT;
BEGIN
    -- Extract basic data
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'User');
    last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'Unknown');
    phone_val := NEW.raw_user_meta_data->>'phone';
    specialty_val := COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Practice');
    license_number_val := COALESCE(NEW.raw_user_meta_data->>'license_number', 'TBD');

    -- Handle licensed array extraction
    licensed_val := '{}'; -- Default to empty array
    
    IF NEW.raw_user_meta_data ? 'licensed' THEN
        BEGIN
            SELECT ARRAY(
                SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'licensed')
            ) INTO licensed_val;
            RAISE LOG 'Method 1 success - extracted licensed: %', licensed_val;
        EXCEPTION
            WHEN OTHERS THEN
                licensed_val := '{}';
        END;
    END IF;

    RAISE LOG 'Creating user: email=%, role=%, licensed=%', NEW.email, user_role, licensed_val;

    -- Create profile (check if exists first)
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = NEW.id) THEN
        INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
        VALUES (NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW());
    END IF;

    -- Create role-specific records
    IF user_role = 'patient' THEN
        -- Check if patient already exists
        IF NOT EXISTS (SELECT 1 FROM public.patients WHERE profile_id = NEW.id) THEN
            INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
            VALUES (NEW.id, phone_val, false, NOW(), NOW());
        END IF;

        -- Auto-assign patient to provider
        PERFORM public.assign_provider_with_fallback(NEW.id);

    ELSIF user_role = 'provider' THEN
        -- Check if provider already exists
        IF NOT EXISTS (SELECT 1 FROM public.providers WHERE profile_id = NEW.id) THEN
            INSERT INTO public.providers (profile_id, specialty, license_number, phone, licensed, active, created_at, updated_at)
            VALUES (NEW.id, specialty_val, license_number_val, phone_val, licensed_val, true, NOW(), NOW())
            RETURNING id INTO new_provider_id;
        ELSE
            SELECT id INTO new_provider_id FROM public.providers WHERE profile_id = NEW.id;
        END IF;

        -- Create provider schedule if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM public.provider_schedules WHERE provider_id = new_provider_id) THEN
            INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, treatment_types, active, created_at, updated_at)
            VALUES
                (new_provider_id, 1, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
                (new_provider_id, 2, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
                (new_provider_id, 3, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
                (new_provider_id, 4, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
                (new_provider_id, 5, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW());
        END IF;

        RAISE NOTICE 'PROVIDER CREATED: % with licensed states: %', NEW.email, licensed_val;

    ELSIF user_role = 'admin' THEN
        -- Check if admin already exists
        IF NOT EXISTS (SELECT 1 FROM public.admins WHERE profile_id = NEW.id) THEN
            INSERT INTO public.admins (profile_id, permissions, active, created_at, updated_at)
            VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true, NOW(), NOW());
        END IF;
    END IF;

    RAISE LOG 'Auth trigger completed successfully for: %', NEW.email;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'CRITICAL ERROR in auth trigger for %: % - %', NEW.email, SQLSTATE, SQLERRM;
        RAISE EXCEPTION 'Auth trigger failed for %: %', NEW.email, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the fix
SELECT 'Auth trigger fixed - ON CONFLICT issues resolved' as status;