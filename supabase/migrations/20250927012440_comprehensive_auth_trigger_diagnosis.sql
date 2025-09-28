-- Comprehensive auth trigger diagnosis

DO $$
DECLARE
    trigger_count INTEGER;
    function_exists BOOLEAN;
    auth_users_count INTEGER;
    profiles_count INTEGER;
    providers_count INTEGER;
    schedules_count INTEGER;
    trigger_rec RECORD;
    user_rec RECORD;
BEGIN
    RAISE NOTICE '=== COMPREHENSIVE AUTH TRIGGER DIAGNOSIS ===';
    
    -- 1. Check if auth.users table exists and has data
    SELECT COUNT(*) INTO auth_users_count FROM auth.users;
    RAISE NOTICE '1. Auth users count: %', auth_users_count;
    
    -- 2. Check if our tables exist and have data
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    SELECT COUNT(*) INTO providers_count FROM public.providers;
    SELECT COUNT(*) INTO schedules_count FROM public.provider_schedules;
    RAISE NOTICE '2. Current table counts:';
    RAISE NOTICE '   - Profiles: %', profiles_count;
    RAISE NOTICE '   - Providers: %', providers_count;
    RAISE NOTICE '   - Schedules: %', schedules_count;
    
    -- 3. Check if the trigger function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
    ) INTO function_exists;
    RAISE NOTICE '3. Trigger function exists: %', function_exists;
    
    -- 4. Check all triggers on auth.users
    SELECT COUNT(*) INTO trigger_count
    FROM pg_trigger t 
    JOIN pg_class c ON t.tgrelid = c.oid 
    JOIN pg_namespace n ON c.relnamespace = n.oid 
    WHERE n.nspname = 'auth' AND c.relname = 'users';
    
    RAISE NOTICE '4. Total triggers on auth.users: %', trigger_count;
    
    -- 5. List all triggers on auth.users
    RAISE NOTICE '5. Triggers on auth.users:';
    FOR trigger_rec IN (
        SELECT t.tgname, t.tgenabled, t.tgtype, p.proname as function_name
        FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        LEFT JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
    ) LOOP
        RAISE NOTICE '   - %: enabled=%, type=%, function=%', 
            trigger_rec.tgname, trigger_rec.tgenabled, trigger_rec.tgtype, trigger_rec.function_name;
    END LOOP;
    
    -- 6. Check if our specific trigger exists
    IF EXISTS (
        SELECT 1 FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE t.tgname = 'on_auth_user_created' 
        AND n.nspname = 'auth' 
        AND c.relname = 'users'
    ) THEN
        RAISE NOTICE '6. Our trigger "on_auth_user_created" EXISTS on auth.users';
    ELSE
        RAISE NOTICE '6. Our trigger "on_auth_user_created" is MISSING from auth.users';
    END IF;
    
    -- 7. Check recent auth users and see if they have profiles
    RAISE NOTICE '7. Recent auth users and their profiles:';
    FOR user_rec IN (
        SELECT u.id, u.email, u.created_at, p.role
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        ORDER BY u.created_at DESC
        LIMIT 5
    ) LOOP
        RAISE NOTICE '   - User %: email=%, created=%, profile_role=%', 
            user_rec.id, user_rec.email, user_rec.created_at, COALESCE(user_rec.role, 'NO_PROFILE');
    END LOOP;
    
    -- 8. Check function permissions
    RAISE NOTICE '8. Function permissions:';
    FOR trigger_rec IN (
        SELECT proname, proowner, prosecdef
        FROM pg_proc 
        WHERE proname = 'handle_new_user'
    ) LOOP
        RAISE NOTICE '   - Function: %, owner: %, security_definer: %', 
            trigger_rec.proname, trigger_rec.proowner, trigger_rec.prosecdef;
    END LOOP;
    
    -- 9. Check if there are any users with role metadata but no profiles
    FOR user_rec IN (
        SELECT u.id, u.email, u.raw_user_meta_data->>'role' as meta_role
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL
        AND u.raw_user_meta_data->>'role' IS NOT NULL
        LIMIT 3
    ) LOOP
        RAISE NOTICE '9. User without profile: % (email: %, meta_role: %)', 
            user_rec.id, user_rec.email, user_rec.meta_role;
    END LOOP;
    
    RAISE NOTICE '=== DIAGNOSIS COMPLETE ===';
    
END $$;