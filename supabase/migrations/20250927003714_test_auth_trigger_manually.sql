-- Test if we can manually create records and check trigger status

DO $$
DECLARE
    test_user_id UUID;
    profile_count INTEGER;
    provider_count INTEGER;
    schedule_count INTEGER;
    trigger_attached BOOLEAN;
    trigger_rec RECORD;
BEGIN
    test_user_id := gen_random_uuid();
    
    RAISE NOTICE 'Testing manual record creation...';
    
    -- Test if we can create records manually (same as trigger would do)
    INSERT INTO public.profiles (id, email, role, first_name, last_name)
    VALUES (test_user_id, 'manual.test@example.com', 'provider', 'Manual', 'Test');
    
    INSERT INTO public.providers (profile_id, specialty, license_number, active)
    VALUES (test_user_id, 'Internal Medicine', 'MANUAL123', true);
    
    INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at)
    SELECT p.id, generate_series(1, 5), '09:00:00', '17:00:00', true, now()
    FROM public.providers p WHERE p.profile_id = test_user_id;
    
    -- Check results
    SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE id = test_user_id;
    SELECT COUNT(*) INTO provider_count FROM public.providers WHERE profile_id = test_user_id;
    SELECT COUNT(*) INTO schedule_count FROM public.provider_schedules ps
    JOIN public.providers p ON ps.provider_id = p.id WHERE p.profile_id = test_user_id;
    
    RAISE NOTICE 'Manual creation results: % profiles, % providers, % schedules', profile_count, provider_count, schedule_count;
    
    -- Check trigger status
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE t.tgname = 'on_auth_user_created' 
        AND n.nspname = 'auth' 
        AND c.relname = 'users'
        AND t.tgenabled = 'O'
    ) INTO trigger_attached;
    
    IF trigger_attached THEN
        RAISE NOTICE 'Trigger is properly attached to auth.users';
    ELSE
        RAISE NOTICE 'WARNING: Trigger is NOT attached to auth.users';
        
        -- Show what triggers exist
        FOR trigger_rec IN (
            SELECT t.tgname, n.nspname, c.relname 
            FROM pg_trigger t 
            JOIN pg_class c ON t.tgrelid = c.oid 
            JOIN pg_namespace n ON c.relnamespace = n.oid 
            WHERE t.tgname LIKE '%auth%' OR t.tgname LIKE '%user%'
        ) LOOP
            RAISE NOTICE 'Found trigger: % on %.%', trigger_rec.tgname, trigger_rec.nspname, trigger_rec.relname;
        END LOOP;
    END IF;
    
    -- Cleanup
    DELETE FROM public.provider_schedules WHERE provider_id IN (
        SELECT id FROM public.providers WHERE profile_id = test_user_id
    );
    DELETE FROM public.providers WHERE profile_id = test_user_id;
    DELETE FROM public.profiles WHERE id = test_user_id;
    
    RAISE NOTICE 'Test complete';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error in manual test: %', SQLERRM;
END $$;