-- Debug auth trigger status and test signup flow

-- Check if triggers exist and are enabled
DO $$
DECLARE
    auth_trigger_exists BOOLEAN;
    provider_trigger_exists BOOLEAN;
    auth_user_count INTEGER;
    profile_count INTEGER;
    provider_count INTEGER;
    schedule_count INTEGER;
BEGIN
    -- Check triggers
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger t 
        JOIN pg_class c ON t.tgrelid = c.oid 
        JOIN pg_namespace n ON c.relnamespace = n.oid 
        WHERE t.tgname = 'on_auth_user_created' 
        AND n.nspname = 'auth' 
        AND c.relname = 'users'
    ) INTO auth_trigger_exists;
    
    SELECT EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'on_provider_created'
    ) INTO provider_trigger_exists;
    
    RAISE NOTICE 'Trigger Status:';
    RAISE NOTICE '  Auth trigger (on_auth_user_created): %', auth_trigger_exists;
    RAISE NOTICE '  Provider trigger (on_provider_created): %', provider_trigger_exists;
    
    -- Check current counts
    SELECT COUNT(*) INTO auth_user_count FROM auth.users;
    SELECT COUNT(*) INTO profile_count FROM profiles;
    SELECT COUNT(*) INTO provider_count FROM providers;
    SELECT COUNT(*) INTO schedule_count FROM provider_schedules;
    
    RAISE NOTICE 'Current Counts:';
    RAISE NOTICE '  Auth users: %', auth_user_count;
    RAISE NOTICE '  Profiles: %', profile_count;
    RAISE NOTICE '  Providers: %', provider_count;
    RAISE NOTICE '  Schedules: %', schedule_count;
    
    -- If there are auth users but no profiles, the trigger isn't working
    IF auth_user_count > 0 AND profile_count = 0 THEN
        RAISE NOTICE 'ISSUE: Auth users exist but no profiles - trigger not firing!';
    ELSIF auth_user_count = 0 THEN
        RAISE NOTICE 'No auth users found - signup may not be completing';
    ELSIF auth_user_count = profile_count THEN
        RAISE NOTICE 'Auth users match profiles - trigger working correctly';
    END IF;
    
    -- Test the auth trigger function directly if it exists
    IF auth_trigger_exists THEN
        RAISE NOTICE 'Auth trigger function exists - testing would require actual auth user creation';
    ELSE
        RAISE NOTICE 'Auth trigger is missing - this needs to be fixed!';
        
        -- Recreate the auth trigger if missing
        RAISE NOTICE 'Recreating auth trigger...';
        
        CREATE TRIGGER on_auth_user_created
            AFTER INSERT ON auth.users
            FOR EACH ROW EXECUTE FUNCTION handle_new_user();
            
        RAISE NOTICE 'Auth trigger recreated';
    END IF;
    
END $$;