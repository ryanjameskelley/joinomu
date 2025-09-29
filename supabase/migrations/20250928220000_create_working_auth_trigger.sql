-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- Create the trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    first_name TEXT;
    last_name TEXT;
    specialty TEXT;
    license_number TEXT;
    phone TEXT;
    new_profile_id UUID;
    new_provider_id UUID;
BEGIN
    -- Extract user metadata
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', '');
    last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', '');
    specialty := COALESCE(NEW.raw_user_meta_data->>'specialty', '');
    license_number := COALESCE(NEW.raw_user_meta_data->>'license_number', '');
    phone := COALESCE(NEW.raw_user_meta_data->>'phone', '');

    -- Create profile
    INSERT INTO public.profiles (id, first_name, last_name, role)
    VALUES (NEW.id, first_name, last_name, user_role)
    RETURNING id INTO new_profile_id;

    -- Create role-specific record
    IF user_role = 'patient' THEN
        INSERT INTO public.patients (profile_id, first_name, last_name)
        VALUES (new_profile_id, first_name, last_name);
        
    ELSIF user_role = 'provider' THEN
        INSERT INTO public.providers (profile_id, first_name, last_name, specialty, license_number, phone)
        VALUES (new_profile_id, first_name, last_name, 
                COALESCE(NULLIF(specialty, ''), 'General Practice'),
                COALESCE(NULLIF(license_number, ''), 'TBD'),
                phone)
        RETURNING id INTO new_provider_id;
        
        -- Create default schedule for provider
        IF new_provider_id IS NOT NULL THEN
            INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, treatment_type)
            VALUES 
                (new_provider_id, 'Monday', '09:00', '17:00', 'semaglutide'),
                (new_provider_id, 'Tuesday', '09:00', '17:00', 'semaglutide'),
                (new_provider_id, 'Wednesday', '09:00', '17:00', 'semaglutide'),
                (new_provider_id, 'Thursday', '09:00', '17:00', 'semaglutide'),
                (new_provider_id, 'Friday', '09:00', '17:00', 'semaglutide')
            ON CONFLICT (provider_id, day_of_week, start_time, end_time) DO NOTHING;
        END IF;
        
    ELSIF user_role = 'admin' THEN
        INSERT INTO public.admins (profile_id, first_name, last_name)
        VALUES (new_profile_id, first_name, last_name);
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't fail the auth process
        RAISE LOG 'Error in handle_new_user trigger: % %', SQLERRM, SQLSTATE;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();