-- Fixed auth trigger with proper licensed array handling
-- This ensures the licensed column is populated correctly during provider signup

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

    -- Handle licensed array extraction with multiple fallback methods
    licensed_val := '{}'; -- Default to empty array
    
    IF NEW.raw_user_meta_data ? 'licensed' THEN
        -- Method 1: Try as JSONB array
        BEGIN
            SELECT ARRAY(
                SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'licensed')
            ) INTO licensed_val;
            RAISE LOG 'Method 1 success - extracted licensed: %', licensed_val;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE LOG 'Method 1 failed: %', SQLERRM;
                
                -- Method 2: Try as JSON text array
                BEGIN
                    licensed_json_text := NEW.raw_user_meta_data->>'licensed';
                    IF licensed_json_text IS NOT NULL AND licensed_json_text != 'null' THEN
                        SELECT ARRAY(
                            SELECT json_array_elements_text(licensed_json_text::json)
                        ) INTO licensed_val;
                        RAISE LOG 'Method 2 success - extracted licensed: %', licensed_val;
                    END IF;
                EXCEPTION
                    WHEN OTHERS THEN
                        RAISE LOG 'Method 2 failed: %', SQLERRM;
                        
                        -- Method 3: Try as simple string (single state)
                        BEGIN
                            licensed_json_text := NEW.raw_user_meta_data->>'licensed';
                            IF licensed_json_text IS NOT NULL AND licensed_json_text != 'null' AND licensed_json_text != '[]' THEN
                                licensed_val := ARRAY[licensed_json_text];
                                RAISE LOG 'Method 3 success - single state: %', licensed_val;
                            END IF;
                        EXCEPTION
                            WHEN OTHERS THEN
                                RAISE LOG 'Method 3 failed: %', SQLERRM;
                                licensed_val := '{}';
                        END;
                END;
        END;
    ELSE
        RAISE LOG 'No licensed field found in metadata';
    END IF;

    RAISE LOG 'Creating user: email=%, role=%, licensed=%', NEW.email, user_role, licensed_val;

    -- Create profile
    INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        role = EXCLUDED.role,
        updated_at = NOW();

    -- Create role-specific records
    IF user_role = 'patient' THEN
        INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
        VALUES (NEW.id, phone_val, false, NOW(), NOW())
        ON CONFLICT (profile_id) DO UPDATE SET
            phone = EXCLUDED.phone,
            updated_at = NOW();

        -- Auto-assign patient to provider
        PERFORM public.assign_provider_with_fallback(NEW.id);

    ELSIF user_role = 'provider' THEN
        -- Create provider WITH licensed column
        INSERT INTO public.providers (profile_id, specialty, license_number, phone, licensed, active, created_at, updated_at)
        VALUES (NEW.id, specialty_val, license_number_val, phone_val, licensed_val, true, NOW(), NOW())
        ON CONFLICT (profile_id) DO UPDATE SET
            specialty = EXCLUDED.specialty,
            license_number = EXCLUDED.license_number,
            phone = EXCLUDED.phone,
            licensed = EXCLUDED.licensed,
            active = EXCLUDED.active,
            updated_at = NOW()
        RETURNING id INTO new_provider_id;

        -- Get provider ID if conflict occurred
        IF new_provider_id IS NULL THEN
            SELECT id INTO new_provider_id FROM public.providers WHERE profile_id = NEW.id;
        END IF;

        -- Create provider schedule
        INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, treatment_types, active, created_at, updated_at)
        VALUES
            (new_provider_id, 1, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 2, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 3, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 4, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 5, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW())
        ON CONFLICT (provider_id, day_of_week) DO NOTHING;

        RAISE NOTICE 'PROVIDER CREATED: % with licensed states: %', NEW.email, licensed_val;

    ELSIF user_role = 'admin' THEN
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
        RAISE LOG 'CRITICAL ERROR in auth trigger for %: % - %', NEW.email, SQLSTATE, SQLERRM;
        RAISE EXCEPTION 'Auth trigger failed for %: %', NEW.email, SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the licensed column exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'providers' AND column_name = 'licensed'
    ) THEN
        RAISE EXCEPTION 'Licensed column does not exist! Run: ALTER TABLE providers ADD COLUMN licensed TEXT[] DEFAULT ''{}''';
    ELSE
        RAISE NOTICE 'Licensed column exists - ready for provider signup';
    END IF;
END $$;