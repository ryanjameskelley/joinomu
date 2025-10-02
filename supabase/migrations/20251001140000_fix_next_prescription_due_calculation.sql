-- Fix next prescription due calculation to use preference.faxed field directly
-- instead of looking up faxes table, since UI is using preference.faxed

-- Update the trigger function to use the preference's own faxed field
CREATE OR REPLACE FUNCTION update_preference_on_medication_adjustment()
RETURNS TRIGGER AS $$
DECLARE
    v_fax_date DATE;
    v_calculated_due_date DATE;
    v_preference_record RECORD;
BEGIN
    -- Only proceed if this is an approval (new_status = 'approved')
    IF NEW.new_status = 'approved' THEN
        -- Update the preference with the new values from the adjustment
        UPDATE patient_medication_preferences 
        SET 
            preferred_dosage = COALESCE(NEW.new_dosage, preferred_dosage),
            frequency = COALESCE(NEW.new_frequency, frequency),
            status = NEW.new_status,
            supply_days = COALESCE(NEW.new_supply_days, supply_days),
            notes = COALESCE(NEW.new_provider_notes, notes),
            updated_at = NOW()
        WHERE id = NEW.preference_id;
        
        -- If supply_days was provided, calculate and update next_prescription_due
        -- using the faxed field from the preference itself
        IF NEW.new_supply_days IS NOT NULL AND NEW.new_supply_days > 0 THEN
            -- Get the preference record to access the faxed field
            SELECT faxed::date
            INTO v_fax_date
            FROM patient_medication_preferences 
            WHERE id = NEW.preference_id;
            
            -- If we have a fax date, calculate next due date
            IF v_fax_date IS NOT NULL THEN
                v_calculated_due_date := v_fax_date + NEW.new_supply_days;
                
                -- Update the preference with the calculated due date
                UPDATE patient_medication_preferences 
                SET 
                    next_prescription_due = v_calculated_due_date,
                    updated_at = NOW()
                WHERE id = NEW.preference_id;
                
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
                        'Updated next prescription due based on preference fax date and supply',
                        jsonb_build_object(
                            'preference_id', NEW.preference_id,
                            'fax_date', v_fax_date,
                            'supply_days', NEW.new_supply_days,
                            'calculated_due_date', v_calculated_due_date
                        )
                    );
                EXCEPTION WHEN OTHERS THEN
                    -- Ignore logging errors, don't fail the main operation
                    NULL;
                END;
            ELSE
                -- Log that no fax date was found (if logging table exists)
                BEGIN
                    INSERT INTO auth_trigger_logs (
                        step, 
                        status, 
                        message, 
                        metadata
                    ) VALUES (
                        'SUPPLY_CALCULATION', 
                        'WARNING', 
                        'No fax date found in preference, cannot calculate next due date',
                        jsonb_build_object(
                            'preference_id', NEW.preference_id,
                            'supply_days', NEW.new_supply_days
                        )
                    );
                EXCEPTION WHEN OTHERS THEN
                    -- Ignore logging errors, don't fail the main operation
                    NULL;
                END;
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create function to fix existing preferences that have supply but no calculated due date
CREATE OR REPLACE FUNCTION fix_existing_next_due_calculations()
RETURNS INTEGER AS $$
DECLARE
    preference_record RECORD;
    v_fax_date DATE;
    v_calculated_due_date DATE;
    v_updated_count INTEGER := 0;
BEGIN
    -- Loop through all preferences that have supply_days but no next_prescription_due
    FOR preference_record IN 
        SELECT id, supply_days, faxed
        FROM patient_medication_preferences 
        WHERE supply_days IS NOT NULL 
          AND supply_days > 0 
          AND (next_prescription_due IS NULL OR next_prescription_due < CURRENT_DATE)
          AND faxed IS NOT NULL
    LOOP
        -- Use the faxed date from the preference
        v_fax_date := preference_record.faxed::date;
        
        -- Calculate and update
        IF v_fax_date IS NOT NULL THEN
            v_calculated_due_date := v_fax_date + preference_record.supply_days;
            
            UPDATE patient_medication_preferences 
            SET 
                next_prescription_due = v_calculated_due_date,
                updated_at = NOW()
            WHERE id = preference_record.id;
            
            v_updated_count := v_updated_count + 1;
        END IF;
    END LOOP;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the new function
COMMENT ON FUNCTION fix_existing_next_due_calculations() IS 'Fixes next_prescription_due for preferences with supply_days based on preference.faxed field';

-- Run the fix function to update existing data
SELECT fix_existing_next_due_calculations() AS updated_preferences_count;