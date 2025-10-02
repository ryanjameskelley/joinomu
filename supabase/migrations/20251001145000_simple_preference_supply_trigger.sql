-- Simple trigger that fires when patient_medication_preferences is updated with supply_days
-- This matches the original requirement: when provider approves via medication adjustments,
-- update supply in preferences and calculate next prescription due

-- Create trigger function that calculates next_prescription_due when supply_days is updated
CREATE OR REPLACE FUNCTION calculate_next_prescription_due()
RETURNS TRIGGER AS $$
DECLARE
    v_fax_date DATE;
    v_calculated_due_date DATE;
BEGIN
    -- Only proceed if supply_days was added/changed and we have an approved status
    IF NEW.supply_days IS NOT NULL 
       AND NEW.supply_days > 0 
       AND NEW.status = 'approved'
       AND (OLD.supply_days IS NULL OR OLD.supply_days != NEW.supply_days OR OLD.status != 'approved') THEN
        
        -- Use the faxed date from the preference itself
        IF NEW.faxed IS NOT NULL THEN
            v_fax_date := NEW.faxed::date;
            v_calculated_due_date := v_fax_date + NEW.supply_days;
            
            -- Update the next_prescription_due field
            NEW.next_prescription_due := v_calculated_due_date;
            
            -- Log the calculation for debugging (if logging table exists)
            BEGIN
                INSERT INTO auth_trigger_logs (
                    step, 
                    status, 
                    message, 
                    metadata
                ) VALUES (
                    'SUPPLY_CALCULATION', 
                    'SUCCESS', 
                    'Calculated next prescription due from preference update',
                    jsonb_build_object(
                        'preference_id', NEW.id,
                        'fax_date', v_fax_date,
                        'supply_days', NEW.supply_days,
                        'calculated_due_date', v_calculated_due_date
                    )
                );
            EXCEPTION WHEN OTHERS THEN
                -- Ignore logging errors, don't fail the main operation
                NULL;
            END;
        ELSE
            -- If no fax date, set the faxed date to now when approving with supply
            NEW.faxed := NOW();
            v_fax_date := NEW.faxed::date;
            v_calculated_due_date := v_fax_date + NEW.supply_days;
            NEW.next_prescription_due := v_calculated_due_date;
            
            -- Log that we set the fax date
            BEGIN
                INSERT INTO auth_trigger_logs (
                    step, 
                    status, 
                    message, 
                    metadata
                ) VALUES (
                    'SUPPLY_CALCULATION', 
                    'SUCCESS', 
                    'Set fax date to now and calculated next prescription due',
                    jsonb_build_object(
                        'preference_id', NEW.id,
                        'fax_date', v_fax_date,
                        'supply_days', NEW.supply_days,
                        'calculated_due_date', v_calculated_due_date
                    )
                );
            EXCEPTION WHEN OTHERS THEN
                -- Ignore logging errors, don't fail the main operation
                NULL;
            END;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on patient_medication_preferences table
DROP TRIGGER IF EXISTS calculate_next_due_on_supply_update ON patient_medication_preferences;
CREATE TRIGGER calculate_next_due_on_supply_update
    BEFORE UPDATE ON patient_medication_preferences
    FOR EACH ROW
    EXECUTE FUNCTION calculate_next_prescription_due();

-- Add comment to the trigger
COMMENT ON TRIGGER calculate_next_due_on_supply_update ON patient_medication_preferences IS 'Calculates next_prescription_due when supply_days is updated with approved status';

-- Test the trigger with our existing test data
UPDATE patient_medication_preferences 
SET supply_days = 45, status = 'approved'
WHERE id = (SELECT id FROM patient_medication_preferences LIMIT 1);

-- Show the result
SELECT id, supply_days, next_prescription_due, faxed, status 
FROM patient_medication_preferences 
WHERE supply_days IS NOT NULL;