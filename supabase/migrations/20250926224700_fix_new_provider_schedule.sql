-- Fix schedule for the new provider and ensure trigger works
-- The trigger appears to not be firing for new provider signups

-- First, add schedules for the new provider manually
DO $$
DECLARE
    provider_record RECORD;
BEGIN
    RAISE NOTICE 'Creating schedules for any providers without schedules...';
    
    FOR provider_record IN 
        SELECT p.id, p.profile_id, pr.email, p.created_at
        FROM providers p 
        JOIN profiles pr ON p.profile_id = pr.id
        WHERE p.id NOT IN (SELECT DISTINCT provider_id FROM provider_schedules WHERE provider_id IS NOT NULL)
        ORDER BY p.created_at
    LOOP
        RAISE NOTICE 'Creating schedule for provider % (email: %, created: %)', provider_record.id, provider_record.email, provider_record.created_at;
        
        -- Insert Monday-Friday schedule
        INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
        (provider_record.id, 1, '09:00:00', '17:00:00', true, now()), -- Monday
        (provider_record.id, 2, '09:00:00', '17:00:00', true, now()), -- Tuesday
        (provider_record.id, 3, '09:00:00', '17:00:00', true, now()), -- Wednesday
        (provider_record.id, 4, '09:00:00', '17:00:00', true, now()), -- Thursday
        (provider_record.id, 5, '09:00:00', '17:00:00', true, now()); -- Friday
        
        RAISE NOTICE 'Created schedule for provider % (email: %)', provider_record.id, provider_record.email;
    END LOOP;
END $$;

-- Now let's check if the trigger actually exists and recreate it
DO $$
BEGIN
    -- Check if trigger exists
    IF EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_provider_created') THEN
        RAISE NOTICE 'Trigger on_provider_created exists, dropping and recreating...';
        DROP TRIGGER on_provider_created ON providers;
    ELSE
        RAISE NOTICE 'Trigger on_provider_created does not exist, creating...';
    END IF;
END $$;

-- Ensure the function exists and recreate it with better logging
CREATE OR REPLACE FUNCTION create_default_provider_schedule()
RETURNS TRIGGER AS $$
BEGIN
    RAISE LOG 'Provider schedule trigger fired for provider ID: %', NEW.id;
    RAISE NOTICE 'Provider schedule trigger fired for provider ID: %', NEW.id;
    
    -- Add Monday-Friday 9 AM to 5 PM schedule for new provider
    INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
    (NEW.id, 1, '09:00:00', '17:00:00', true, now()), -- Monday
    (NEW.id, 2, '09:00:00', '17:00:00', true, now()), -- Tuesday
    (NEW.id, 3, '09:00:00', '17:00:00', true, now()), -- Wednesday
    (NEW.id, 4, '09:00:00', '17:00:00', true, now()), -- Thursday
    (NEW.id, 5, '09:00:00', '17:00:00', true, now()); -- Friday
    
    RAISE LOG 'Created default schedule for provider %', NEW.id;
    RAISE NOTICE 'Created default schedule for provider %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the provider creation
        RAISE LOG 'Error creating default schedule for provider %: %', NEW.id, SQLERRM;
        RAISE NOTICE 'Error creating default schedule for provider %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_provider_created
    AFTER INSERT ON providers
    FOR EACH ROW EXECUTE FUNCTION create_default_provider_schedule();

-- Test the trigger by checking total count
DO $$
DECLARE
    provider_count INTEGER;
    schedule_count INTEGER;
    distinct_provider_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO provider_count FROM providers;
    SELECT COUNT(*) INTO schedule_count FROM provider_schedules;
    SELECT COUNT(DISTINCT provider_id) INTO distinct_provider_count FROM provider_schedules;
    
    RAISE NOTICE 'Found % providers total', provider_count;
    RAISE NOTICE 'Found % schedule entries total', schedule_count;
    RAISE NOTICE 'Found % distinct providers with schedules', distinct_provider_count;
    
    IF provider_count = distinct_provider_count THEN
        RAISE NOTICE 'SUCCESS: All providers now have schedules!';
    ELSE
        RAISE NOTICE 'WARNING: % providers still missing schedules', provider_count - distinct_provider_count;
    END IF;
END $$;