-- Update medication adjustment trigger to use faxed date from preferences table directly
-- This is more efficient than querying the separate faxes table

CREATE OR REPLACE FUNCTION update_preference_on_medication_adjustment()
RETURNS TRIGGER AS $$
DECLARE
    v_faxed_date DATE;
    v_calculated_due_date DATE;
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
        
        -- If supply_days was provided, calculate next_prescription_due using faxed date from preferences
        IF NEW.new_supply_days IS NOT NULL AND NEW.new_supply_days > 0 THEN
            -- Get the faxed date directly from the updated preference
            SELECT faxed::date 
            INTO v_faxed_date
            FROM patient_medication_preferences 
            WHERE id = NEW.preference_id;
            
            -- If we have a faxed date, calculate next due date
            IF v_faxed_date IS NOT NULL THEN
                v_calculated_due_date := v_faxed_date + NEW.new_supply_days;
                
                -- Update the preference with the calculated due date
                UPDATE patient_medication_preferences 
                SET 
                    next_prescription_due = v_calculated_due_date,
                    updated_at = NOW()
                WHERE id = NEW.preference_id;
                
                -- Log the calculation for debugging
                INSERT INTO auth_trigger_logs (
                    step, 
                    status, 
                    message, 
                    metadata
                ) VALUES (
                    'SUPPLY_CALCULATION', 
                    'SUCCESS', 
                    'Updated next prescription due based on preferences faxed date and supply',
                    jsonb_build_object(
                        'preference_id', NEW.preference_id,
                        'faxed_date', v_faxed_date,
                        'supply_days', NEW.new_supply_days,
                        'calculated_due_date', v_calculated_due_date
                    )
                );
            ELSE
                -- Log that no faxed date was found in preferences
                INSERT INTO auth_trigger_logs (
                    step, 
                    status, 
                    message, 
                    metadata
                ) VALUES (
                    'SUPPLY_CALCULATION', 
                    'WARNING', 
                    'No faxed date found in preferences, cannot calculate next due date',
                    jsonb_build_object(
                        'preference_id', NEW.preference_id,
                        'supply_days', NEW.new_supply_days
                    )
                );
            END IF;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Also update the maintenance function to use preferences.faxed directly
CREATE OR REPLACE FUNCTION update_next_due_from_supply_and_fax()
RETURNS INTEGER AS $$
DECLARE
    preference_record RECORD;
    v_calculated_due_date DATE;
    v_updated_count INTEGER := 0;
BEGIN
    -- Loop through all preferences that have supply_days and faxed date but no next_prescription_due
    FOR preference_record IN 
        SELECT id, supply_days, faxed::date as faxed_date
        FROM patient_medication_preferences 
        WHERE supply_days IS NOT NULL 
          AND supply_days > 0 
          AND faxed IS NOT NULL
          AND (next_prescription_due IS NULL OR next_prescription_due < CURRENT_DATE)
    LOOP
        -- Calculate next due date using faxed date from preferences
        v_calculated_due_date := preference_record.faxed_date + preference_record.supply_days;
        
        UPDATE patient_medication_preferences 
        SET 
            next_prescription_due = v_calculated_due_date,
            updated_at = NOW()
        WHERE id = preference_record.id;
        
        v_updated_count := v_updated_count + 1;
    END LOOP;
    
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- Update comments
COMMENT ON FUNCTION update_preference_on_medication_adjustment() IS 'Updates patient_medication_preferences when medication adjustments are approved, using faxed date from preferences table for next_prescription_due calculation';
COMMENT ON FUNCTION update_next_due_from_supply_and_fax() IS 'Updates next_prescription_due for preferences with supply_days based on faxed date from preferences table';