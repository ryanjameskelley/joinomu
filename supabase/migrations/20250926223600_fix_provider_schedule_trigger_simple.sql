-- Simple provider schedule trigger fix - focus only on provider_schedules
-- Avoid provider_availability_summary since it's a view

-- Drop the existing trigger and function to recreate them properly
DROP TRIGGER IF EXISTS on_provider_created ON providers;
DROP FUNCTION IF EXISTS create_default_provider_schedule();

-- Create the working trigger function
CREATE OR REPLACE FUNCTION create_default_provider_schedule()
RETURNS TRIGGER AS $$
BEGIN
    RAISE NOTICE 'Provider schedule trigger fired for provider ID: %', NEW.id;
    
    -- Add Monday-Friday 9 AM to 5 PM schedule for new provider
    INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
    (NEW.id, 1, '09:00:00', '17:00:00', true, now()), -- Monday
    (NEW.id, 2, '09:00:00', '17:00:00', true, now()), -- Tuesday
    (NEW.id, 3, '09:00:00', '17:00:00', true, now()), -- Wednesday
    (NEW.id, 4, '09:00:00', '17:00:00', true, now()), -- Thursday
    (NEW.id, 5, '09:00:00', '17:00:00', true, now()); -- Friday
    
    RAISE NOTICE 'Created default schedule for provider %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the provider creation
        RAISE LOG 'Error creating default schedule for provider %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
CREATE TRIGGER on_provider_created
    AFTER INSERT ON providers
    FOR EACH ROW EXECUTE FUNCTION create_default_provider_schedule();

-- Enable RLS on provider_schedules only
ALTER TABLE provider_schedules ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for provider_schedules
DROP POLICY IF EXISTS "Providers can view their own schedules" ON provider_schedules;
DROP POLICY IF EXISTS "Providers can manage their own schedules" ON provider_schedules;

CREATE POLICY "Providers can view their own schedules" ON provider_schedules
    FOR SELECT USING (
        provider_id IN (
            SELECT p.id FROM providers p WHERE p.profile_id = auth.uid()
        )
    );

CREATE POLICY "Providers can manage their own schedules" ON provider_schedules
    FOR ALL USING (
        provider_id IN (
            SELECT p.id FROM providers p WHERE p.profile_id = auth.uid()
        )
    );

-- Now handle existing providers that don't have schedules
DO $$
DECLARE
    provider_record RECORD;
    schedule_count INTEGER;
BEGIN
    RAISE NOTICE 'Creating schedules for existing providers without schedules...';
    
    FOR provider_record IN 
        SELECT p.id, p.profile_id, pr.email 
        FROM providers p 
        JOIN profiles pr ON p.profile_id = pr.id
        WHERE p.id NOT IN (SELECT DISTINCT provider_id FROM provider_schedules WHERE provider_id IS NOT NULL)
    LOOP
        RAISE NOTICE 'Creating schedule for provider % (email: %)', provider_record.id, provider_record.email;
        
        -- Insert Monday-Friday schedule
        INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
        (provider_record.id, 1, '09:00:00', '17:00:00', true, now()), -- Monday
        (provider_record.id, 2, '09:00:00', '17:00:00', true, now()), -- Tuesday
        (provider_record.id, 3, '09:00:00', '17:00:00', true, now()), -- Wednesday
        (provider_record.id, 4, '09:00:00', '17:00:00', true, now()), -- Thursday
        (provider_record.id, 5, '09:00:00', '17:00:00', true, now()); -- Friday
        
        RAISE NOTICE 'Created schedule for provider % (email: %)', provider_record.id, provider_record.email;
    END LOOP;
    
    -- Report final counts
    SELECT COUNT(*) INTO schedule_count FROM provider_schedules;
    RAISE NOTICE 'Total provider schedule entries after migration: %', schedule_count;
END $$;