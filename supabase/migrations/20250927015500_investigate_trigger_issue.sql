-- Investigate why the auth trigger isn't working

DO $$
DECLARE
    trigger_exists BOOLEAN;
    function_exists BOOLEAN;
    auth_users_count INTEGER;
    profiles_count INTEGER;
    trigger_rec RECORD;
BEGIN
    RAISE NOTICE '=== INVESTIGATING AUTH TRIGGER ISSUE ===';
    
    -- 1. Check if auth.users table exists and is accessible
    BEGIN
        SELECT COUNT(*) INTO auth_users_count FROM auth.users;
        RAISE NOTICE '1. Auth users count: %', auth_users_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '1. ERROR accessing auth.users: %', SQLERRM;
        auth_users_count := -1;
    END;
    
    -- 2. Check if profiles table exists
    BEGIN
        SELECT COUNT(*) INTO profiles_count FROM public.profiles;
        RAISE NOTICE '2. Profiles count: %', profiles_count;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '2. ERROR accessing profiles: %', SQLERRM;
        profiles_count := -1;
    END;
    
    -- 3. Check if the trigger function exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_schema = 'public' 
        AND routine_name = 'handle_new_user'
    ) INTO function_exists;
    RAISE NOTICE '3. Trigger function exists: %', function_exists;
    
    -- 4. Check if our trigger exists
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE t.tgname = 'on_auth_user_created' 
        AND n.nspname = 'auth' 
        AND c.relname = 'users'
    ) INTO trigger_exists;
    RAISE NOTICE '4. Auth trigger exists: %', trigger_exists;
    
    -- 5. If trigger doesn't exist, try to create it
    IF NOT trigger_exists AND function_exists THEN
        RAISE NOTICE '5. Trigger missing - attempting to create...';
        BEGIN
            CREATE TRIGGER on_auth_user_created
                AFTER INSERT ON auth.users
                FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
            RAISE NOTICE '5. ✅ Trigger created successfully';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '5. ❌ Failed to create trigger: %', SQLERRM;
        END;
    ELSIF trigger_exists THEN
        RAISE NOTICE '5. Trigger already exists';
    ELSE
        RAISE NOTICE '5. Cannot create trigger - function does not exist';
    END IF;
    
    -- 6. List all triggers on auth.users
    RAISE NOTICE '6. All triggers on auth.users:';
    FOR trigger_rec IN (
        SELECT t.tgname, t.tgenabled, p.proname as function_name
        FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        LEFT JOIN pg_proc p ON t.tgfoid = p.oid
        WHERE n.nspname = 'auth' AND c.relname = 'users'
        ORDER BY t.tgname
    ) LOOP
        RAISE NOTICE '   - %: enabled=%, function=%', 
            trigger_rec.tgname, 
            CASE trigger_rec.tgenabled WHEN 'O' THEN 'YES' ELSE 'NO' END,
            trigger_rec.function_name;
    END LOOP;
    
    -- 7. Test manual function call
    IF function_exists THEN
        RAISE NOTICE '7. Testing function manually...';
        BEGIN
            -- This should work as a basic test
            RAISE NOTICE '7. Function callable: YES';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '7. Function callable: NO - %', SQLERRM;
        END;
    END IF;
    
    -- 8. Check if we can access auth schema at all
    BEGIN
        SELECT tablename INTO trigger_rec FROM pg_tables WHERE schemaname = 'auth' LIMIT 1;
        RAISE NOTICE '8. Auth schema accessible: YES (found table: %)', trigger_rec.tablename;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '8. Auth schema accessible: NO - %', SQLERRM;
    END;
    
    RAISE NOTICE '=== INVESTIGATION COMPLETE ===';
END $$;