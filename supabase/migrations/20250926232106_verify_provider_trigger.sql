-- Simple provider trigger verification

DO $$
DECLARE
    provider_count INTEGER;
    schedule_count INTEGER;
    trigger_exists BOOLEAN;
BEGIN
    SELECT COUNT(*) INTO provider_count FROM providers;
    SELECT COUNT(*) INTO schedule_count FROM provider_schedules;
    SELECT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'on_provider_created') INTO trigger_exists;
    
    RAISE NOTICE 'Provider count: %, Schedule count: %, Trigger exists: %', provider_count, schedule_count, trigger_exists;
    
    IF NOT trigger_exists THEN
        RAISE NOTICE 'Recreating provider schedule trigger...';
        
        CREATE OR REPLACE FUNCTION create_default_provider_schedule()
        RETURNS TRIGGER AS $trigger$
        BEGIN
            RAISE NOTICE 'Provider schedule trigger fired for provider ID: %', NEW.id;
            
            INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
            (NEW.id, 1, '09:00:00', '17:00:00', true, now()),
            (NEW.id, 2, '09:00:00', '17:00:00', true, now()),
            (NEW.id, 3, '09:00:00', '17:00:00', true, now()),
            (NEW.id, 4, '09:00:00', '17:00:00', true, now()),
            (NEW.id, 5, '09:00:00', '17:00:00', true, now());
            
            RAISE NOTICE 'Created schedule for provider %', NEW.id;
            RETURN NEW;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Error creating schedule: %', SQLERRM;
                RETURN NEW;
        END;
        $trigger$ LANGUAGE plpgsql SECURITY DEFINER;

        CREATE TRIGGER on_provider_created
            AFTER INSERT ON providers
            FOR EACH ROW EXECUTE FUNCTION create_default_provider_schedule();
            
        RAISE NOTICE 'Provider schedule trigger recreated successfully';
    ELSE
        RAISE NOTICE 'Provider schedule trigger already exists';
    END IF;
END $$;
