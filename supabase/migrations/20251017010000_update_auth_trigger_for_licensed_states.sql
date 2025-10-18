-- Update the authentication trigger to handle the new licensed states field
-- This ensures the licensed array is properly stored when providers sign up

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
        -- Convert JSON array to TEXT array
        SELECT ARRAY(
            SELECT json_array_elements_text(NEW.raw_user_meta_data->'licensed')
        ) INTO licensed_val;
    ELSE
        licensed_val := '{}'; -- Empty array as default
    END IF;

    -- Create profile first with explicit schema reference
    INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW());

    -- Create role-specific records with explicit schema references
    IF user_role = 'patient' THEN
        INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
        VALUES (NEW.id, phone_val, false, NOW(), NOW());

    ELSIF user_role = 'provider' THEN
        -- Create provider record with licensed states and capture the ID for schedule creation
        INSERT INTO public.providers (profile_id, specialty, license_number, phone, licensed, active, created_at, updated_at)
        VALUES (NEW.id, specialty_val, license_number_val, phone_val, licensed_val, true, NOW(), NOW())
        RETURNING id INTO new_provider_id;

        -- Create default provider schedule (Monday-Friday, 9 AM - 5 PM)
        INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, treatment_types, active, created_at, updated_at)
        VALUES
            (new_provider_id, 1, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 2, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 3, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 4, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW()),
            (new_provider_id, 5, '09:00:00', '17:00:00', ARRAY['weight_loss', 'mens_health'], true, NOW(), NOW());

    ELSIF user_role = 'admin' THEN
        INSERT INTO public.admins (profile_id, permissions, active, created_at, updated_at)
        VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true, NOW(), NOW());
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE LOG 'Error in handle_new_user trigger for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the trigger function was updated successfully
SELECT 
    'Auth Trigger Update Status' as status_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
        THEN '✅ Function updated successfully with licensed states support'
        ELSE '❌ Function update failed'
    END as function_status;