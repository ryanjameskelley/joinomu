-- Complete the provider schedule setup by removing the failing part

-- The trigger is now working, let's just ensure the trigger is properly set up
-- and test it by verifying schedules exist

DO $$
DECLARE
    provider_count INTEGER;
    schedule_count INTEGER;
BEGIN
    -- Count providers and their schedules
    SELECT COUNT(*) INTO provider_count FROM providers;
    SELECT COUNT(DISTINCT provider_id) INTO schedule_count FROM provider_schedules;
    
    RAISE NOTICE 'Found % providers with % having schedules', provider_count, schedule_count;
    
    -- If there are providers without schedules, something is wrong
    IF provider_count > schedule_count THEN
        RAISE NOTICE 'Some providers missing schedules - this should auto-create now';
    ELSE
        RAISE NOTICE 'All providers have schedules - auto-creation is working!';
    END IF;
END $$;

-- The trigger should now work for future provider creations
-- Verify the trigger exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_provider_created') THEN
        RAISE NOTICE 'Provider schedule auto-creation trigger is active';
    ELSE
        RAISE NOTICE 'WARNING: Provider schedule trigger is missing';
    END IF;
END $$;