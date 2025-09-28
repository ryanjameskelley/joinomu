-- Fix provider schedule treatment types to include weight_loss
-- The issue is that schedules have empty treatment_types arrays but the filtering expects specific treatment types

-- Update all existing provider schedules to include common treatment types
UPDATE provider_schedules 
SET treatment_types = ARRAY['weight_loss', 'mens_health', 'consultation', 'follow_up']
WHERE treatment_types = '{}' OR treatment_types IS NULL;

-- Also update the default schedule creation function to include treatment types
CREATE OR REPLACE FUNCTION create_default_provider_schedule()
RETURNS TRIGGER AS $$
BEGIN
    -- Add Monday-Friday 9 AM to 5 PM schedule for new provider with treatment types
    INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, treatment_types, created_at) VALUES
    (NEW.id, 1, '09:00', '17:00', true, ARRAY['weight_loss', 'mens_health', 'consultation', 'follow_up'], now()), -- Monday
    (NEW.id, 2, '09:00', '17:00', true, ARRAY['weight_loss', 'mens_health', 'consultation', 'follow_up'], now()), -- Tuesday
    (NEW.id, 3, '09:00', '17:00', true, ARRAY['weight_loss', 'mens_health', 'consultation', 'follow_up'], now()), -- Wednesday
    (NEW.id, 4, '09:00', '17:00', true, ARRAY['weight_loss', 'mens_health', 'consultation', 'follow_up'], now()), -- Thursday
    (NEW.id, 5, '09:00', '17:00', true, ARRAY['weight_loss', 'mens_health', 'consultation', 'follow_up'], now()); -- Friday
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the provider creation
        RAISE LOG 'Error creating default schedule for provider %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;