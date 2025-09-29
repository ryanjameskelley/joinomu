-- Restore the working authentication trigger system as per the comprehensive guide
-- This will automatically create role-specific records when users sign up through Supabase Auth

-- Step 1: Create the trigger function exactly as specified in the guide
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

    -- Create profile first with explicit schema reference
    INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW());

    -- Create role-specific records with explicit schema references
    IF user_role = 'patient' THEN
        INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
        VALUES (NEW.id, phone_val, false, NOW(), NOW());

    ELSIF user_role = 'provider' THEN
        INSERT INTO public.providers (profile_id, specialty, license_number, phone, active, created_at, updated_at)
        VALUES (NEW.id, specialty_val, license_number_val, phone_val, true, NOW(), NOW())
        RETURNING id INTO new_provider_id;

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

-- Step 2: Attach trigger to auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Step 3: Verify the trigger was created successfully
SELECT 
    'Trigger Restoration Status' as status_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
        THEN '✅ Trigger successfully created'
        ELSE '❌ Trigger creation failed'
    END as trigger_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
        THEN '✅ Function successfully created'
        ELSE '❌ Function creation failed'
    END as function_status;