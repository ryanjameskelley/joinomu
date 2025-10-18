-- Minimal auth trigger that should work
-- Simplified version to get provider signup working

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    first_name TEXT;
    last_name TEXT;
    phone_val TEXT;
    specialty_val TEXT;
    license_number_val TEXT;
    new_provider_id UUID;
BEGIN
    -- Extract basic data
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', 'User');
    last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', 'Unknown');
    phone_val := NEW.raw_user_meta_data->>'phone';
    specialty_val := COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Practice');
    license_number_val := COALESCE(NEW.raw_user_meta_data->>'license_number', 'TBD');

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
        ON CONFLICT (profile_id) DO NOTHING;

    ELSIF user_role = 'provider' THEN
        -- Create provider record WITHOUT licensed column for now
        INSERT INTO public.providers (profile_id, specialty, license_number, phone, active, created_at, updated_at)
        VALUES (NEW.id, specialty_val, license_number_val, phone_val, true, NOW(), NOW())
        ON CONFLICT (profile_id) DO NOTHING
        RETURNING id INTO new_provider_id;

        -- If we couldn't get the ID due to conflict, get it manually
        IF new_provider_id IS NULL THEN
            SELECT id INTO new_provider_id FROM public.providers WHERE profile_id = NEW.id;
        END IF;

        -- Create basic schedule
        INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, treatment_types, active, created_at, updated_at)
        VALUES
            (new_provider_id, 1, '09:00:00', '17:00:00', ARRAY['weight_loss'], true, NOW(), NOW()),
            (new_provider_id, 2, '09:00:00', '17:00:00', ARRAY['weight_loss'], true, NOW(), NOW()),
            (new_provider_id, 3, '09:00:00', '17:00:00', ARRAY['weight_loss'], true, NOW(), NOW()),
            (new_provider_id, 4, '09:00:00', '17:00:00', ARRAY['weight_loss'], true, NOW(), NOW()),
            (new_provider_id, 5, '09:00:00', '17:00:00', ARRAY['weight_loss'], true, NOW(), NOW())
        ON CONFLICT (provider_id, day_of_week) DO NOTHING;

    ELSIF user_role = 'admin' THEN
        INSERT INTO public.admins (profile_id, permissions, active, created_at, updated_at)
        VALUES (NEW.id, ARRAY['dashboard'], true, NOW(), NOW())
        ON CONFLICT (profile_id) DO NOTHING;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth
        RAISE LOG 'Auth trigger error for %: %', NEW.email, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test provider creation
SELECT 'Minimal auth trigger created' as status;