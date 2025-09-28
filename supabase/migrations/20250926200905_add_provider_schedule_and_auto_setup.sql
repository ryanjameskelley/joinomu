-- Add provider schedule for existing provider and setup auto-schedule creation
-- This ensures providers have default schedules and new providers get them automatically

-- First, add schedule for the existing provider (profile_id: 7d1acf4a-4b7f-4014-b830-59aba55f5f60)
DO $$
DECLARE
    provider_record_id UUID;
BEGIN
    -- Get the provider record ID using profile_id
    SELECT id INTO provider_record_id FROM providers WHERE profile_id = '7d1acf4a-4b7f-4014-b830-59aba55f5f60';
    
    -- Only insert if provider exists and doesn't already have a schedule
    IF provider_record_id IS NOT NULL THEN
        -- Check if schedule already exists
        IF NOT EXISTS (SELECT 1 FROM provider_schedules WHERE provider_id = provider_record_id) THEN
            -- Add Monday-Friday 9 AM to 5 PM schedule
            INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
            (provider_record_id, 1, '09:00', '17:00', true, now()), -- Monday
            (provider_record_id, 2, '09:00', '17:00', true, now()), -- Tuesday
            (provider_record_id, 3, '09:00', '17:00', true, now()), -- Wednesday
            (provider_record_id, 4, '09:00', '17:00', true, now()), -- Thursday
            (provider_record_id, 5, '09:00', '17:00', true, now()); -- Friday
            
            RAISE NOTICE 'Successfully created weekday schedule for provider %', provider_record_id;
        ELSE
            RAISE NOTICE 'Schedule already exists for provider %', provider_record_id;
        END IF;
    ELSE
        RAISE NOTICE 'Could not find provider with profile_id 7d1acf4a-4b7f-4014-b830-59aba55f5f60';
    END IF;
END $$;

-- Create function to automatically add default schedule when provider is created
CREATE OR REPLACE FUNCTION create_default_provider_schedule()
RETURNS TRIGGER AS $$
BEGIN
    -- Add Monday-Friday 9 AM to 5 PM schedule for new provider
    INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
    (NEW.id, 1, '09:00', '17:00', true, now()), -- Monday
    (NEW.id, 2, '09:00', '17:00', true, now()), -- Tuesday
    (NEW.id, 3, '09:00', '17:00', true, now()), -- Wednesday
    (NEW.id, 4, '09:00', '17:00', true, now()), -- Thursday
    (NEW.id, 5, '09:00', '17:00', true, now()); -- Friday
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the provider creation
        RAISE LOG 'Error creating default schedule for provider %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically add default schedule when provider is created
CREATE TRIGGER on_provider_created
    AFTER INSERT ON providers
    FOR EACH ROW EXECUTE FUNCTION create_default_provider_schedule();

-- Also add schedules for any existing providers that don't have them
DO $$
DECLARE
    provider_record RECORD;
BEGIN
    FOR provider_record IN SELECT id FROM providers WHERE id NOT IN (SELECT DISTINCT provider_id FROM provider_schedules)
    LOOP
        INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
        (provider_record.id, 1, '09:00', '17:00', true, now()), -- Monday
        (provider_record.id, 2, '09:00', '17:00', true, now()), -- Tuesday
        (provider_record.id, 3, '09:00', '17:00', true, now()), -- Wednesday
        (provider_record.id, 4, '09:00', '17:00', true, now()), -- Thursday
        (provider_record.id, 5, '09:00', '17:00', true, now()); -- Friday
        
        RAISE NOTICE 'Created default schedule for existing provider %', provider_record.id;
    END LOOP;
END $$;