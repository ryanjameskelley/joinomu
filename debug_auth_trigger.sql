-- Temporarily disable the auth trigger to test if it's causing the signup failure

-- First, let's check if the trigger is causing the issue by disabling it
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Test by manually creating an admin user directly to see if it works without the trigger
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    raw_user_meta_data,
    email_confirmed_at,
    created_at,
    updated_at,
    aud,
    role
) VALUES (
    gen_random_uuid(),
    'manual-test@example.com',
    crypt('testpass', gen_salt('bf')),
    '{"role": "admin", "firstName": "Manual", "lastName": "Test"}'::jsonb,
    NOW(),
    NOW(),
    NOW(),
    'authenticated',
    'authenticated'
);

-- Check if the manual user was created successfully
SELECT 
    id, email, raw_user_meta_data->>'role' as role, created_at 
FROM auth.users 
WHERE email = 'manual-test@example.com';

-- Now recreate the trigger with better error handling
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
    -- Log that trigger started (with better error handling)
    BEGIN
        INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
        VALUES (NEW.id, 'TRIGGER_START', true, jsonb_build_object(
            'email', NEW.email,
            'raw_user_meta_data', NEW.raw_user_meta_data
        ));
    EXCEPTION WHEN OTHERS THEN
        -- Continue even if logging fails
        RAISE LOG 'Failed to log trigger start: %', SQLERRM;
    END;

    -- Extract data from raw_user_meta_data only
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    first_name := COALESCE(
        NEW.raw_user_meta_data->>'firstName',
        NEW.raw_user_meta_data->>'first_name', 
        'User'
    );
    last_name := COALESCE(
        NEW.raw_user_meta_data->>'lastName',
        NEW.raw_user_meta_data->>'last_name', 
        'Unknown'
    );
    phone_val := NEW.raw_user_meta_data->>'phone';
    specialty_val := NEW.raw_user_meta_data->>'specialty';
    license_number_val := COALESCE(
        NEW.raw_user_meta_data->>'licenseNumber',
        NEW.raw_user_meta_data->>'license_number'
    );

    -- Create profile first with explicit schema reference
    BEGIN
        INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
        VALUES (NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW());
    EXCEPTION WHEN OTHERS THEN
        -- Log error but don't fail the entire signup
        BEGIN
            INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, error_message, metadata)
            VALUES (NEW.id, 'PROFILE_CREATE_FAILED', false, SQLERRM, jsonb_build_object(
                'sql_state', SQLSTATE
            ));
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Profile creation failed: %', SQLERRM;
        END;
        RETURN NEW; -- Return successfully even if profile creation fails
    END;

    -- Create role-specific records with explicit schema references
    IF user_role = 'patient' THEN
        BEGIN
            INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
            VALUES (NEW.id, phone_val, false, NOW(), NOW());
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Patient creation failed: %', SQLERRM;
        END;

    ELSIF user_role = 'provider' THEN
        BEGIN
            INSERT INTO public.providers (profile_id, specialty, license_number, phone, active, created_at, updated_at)
            VALUES (NEW.id, specialty_val, license_number_val, phone_val, true, NOW(), NOW())
            RETURNING id INTO new_provider_id;
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Provider creation failed: %', SQLERRM;
        END;

    ELSIF user_role = 'admin' THEN
        BEGIN
            INSERT INTO public.admins (profile_id, permissions, active, created_at, updated_at)
            VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true, NOW(), NOW());
        EXCEPTION WHEN OTHERS THEN
            RAISE LOG 'Admin creation failed: %', SQLERRM;
        END;
    END IF;

    -- Always return NEW to ensure auth.users record is created
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error but don't prevent the auth user from being created
        RAISE LOG 'Error in handle_new_user trigger for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
        RETURN NEW; -- Critical: Always return NEW to allow auth user creation
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Clean up test user
DELETE FROM auth.users WHERE email = 'manual-test@example.com';