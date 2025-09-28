-- Force create a working auth trigger
-- Check if trigger exists and drop everything to start fresh

DO $$
DECLARE
    trigger_exists BOOLEAN;
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    RAISE NOTICE 'Trigger exists before cleanup: %', trigger_exists;
END $$;

-- Drop everything related to auth trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

-- Create a very simple, working auth trigger function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
    first_name TEXT;
    last_name TEXT;
BEGIN
    -- Log that trigger fired
    RAISE NOTICE 'AUTH TRIGGER FIRED for user: %', NEW.id;
    
    -- Extract basic info
    user_email := COALESCE(NEW.email, 'unknown@example.com');
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    first_name := COALESCE(NEW.raw_user_meta_data->>'firstName', split_part(user_email, '@', 1));
    last_name := COALESCE(NEW.raw_user_meta_data->>'lastName', '');
    
    RAISE NOTICE 'Creating profile for user % with role %', user_email, user_role;
    
    -- Create profile record
    INSERT INTO public.profiles (
        id, 
        role, 
        email, 
        first_name, 
        last_name,
        created_at,
        updated_at
    ) VALUES (
        NEW.id, 
        user_role, 
        user_email, 
        first_name, 
        last_name,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Profile created successfully';
    
    -- Create role-specific record
    IF user_role = 'patient' THEN
        RAISE NOTICE 'Creating patient record';
        INSERT INTO public.patients (
            id,
            profile_id,
            date_of_birth,
            has_completed_intake,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            '1990-01-01'::DATE,
            false,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Patient record created successfully';
        
    ELSIF user_role = 'provider' THEN
        RAISE NOTICE 'Creating provider record';
        INSERT INTO public.providers (
            id,
            profile_id,
            specialty,
            license_number,
            active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'specialty', 'General'),
            NEW.raw_user_meta_data->>'licenseNumber',
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Provider record created successfully';
        
    ELSIF user_role = 'admin' THEN
        RAISE NOTICE 'Creating admin record';
        INSERT INTO public.admins (
            id,
            profile_id,
            active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Admin record created successfully';
    END IF;
    
    RAISE NOTICE 'AUTH TRIGGER COMPLETED for user: %', NEW.id;
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'AUTH TRIGGER ERROR for user %: %', NEW.id, SQLERRM;
    -- Return NEW to not block auth
    RETURN NEW;
END;
$$;

-- Grant permissions before creating trigger
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO supabase_auth_admin;

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verify trigger was created
DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
BEGIN
    -- Check if trigger exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.triggers 
        WHERE trigger_name = 'on_auth_user_created'
    ) INTO trigger_exists;
    
    -- Check if function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user'
    ) INTO function_exists;
    
    RAISE NOTICE '=== AUTH TRIGGER STATUS ===';
    RAISE NOTICE 'Trigger exists: %', trigger_exists;
    RAISE NOTICE 'Function exists: %', function_exists;
    
    IF trigger_exists AND function_exists THEN
        RAISE NOTICE '✅ AUTH TRIGGER SETUP COMPLETE';
    ELSE
        RAISE NOTICE '❌ AUTH TRIGGER SETUP FAILED';
    END IF;
END $$;

-- Fix existing users who don't have profiles
DO $$
DECLARE
    user_record RECORD;
    user_role TEXT;
    first_name TEXT;
    last_name TEXT;
BEGIN
    RAISE NOTICE 'Fixing existing users without profiles...';
    
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL
    LOOP
        -- Extract user info
        user_role := COALESCE(user_record.raw_user_meta_data->>'role', 'patient');
        first_name := COALESCE(user_record.raw_user_meta_data->>'firstName', split_part(user_record.email, '@', 1));
        last_name := COALESCE(user_record.raw_user_meta_data->>'lastName', '');
        
        RAISE NOTICE 'Fixing user: % (role: %)', user_record.email, user_role;
        
        -- Create profile
        INSERT INTO public.profiles (id, role, email, first_name, last_name, created_at, updated_at)
        VALUES (user_record.id, user_role, user_record.email, first_name, last_name, NOW(), NOW());
        
        -- Create role-specific record
        IF user_role = 'patient' THEN
            INSERT INTO public.patients (id, profile_id, date_of_birth, has_completed_intake, created_at, updated_at)
            VALUES (gen_random_uuid(), user_record.id, '1990-01-01', false, NOW(), NOW());
        ELSIF user_role = 'provider' THEN
            INSERT INTO public.providers (id, profile_id, specialty, active, created_at, updated_at)
            VALUES (gen_random_uuid(), user_record.id, COALESCE(user_record.raw_user_meta_data->>'specialty', 'General'), true, NOW(), NOW());
        ELSIF user_role = 'admin' THEN
            INSERT INTO public.admins (id, profile_id, active, created_at, updated_at)
            VALUES (gen_random_uuid(), user_record.id, true, NOW(), NOW());
        END IF;
        
        RAISE NOTICE '✅ Fixed user: %', user_record.email;
    END LOOP;
    
    RAISE NOTICE '✅ All existing users fixed';
END $$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Working auth trigger with logging';