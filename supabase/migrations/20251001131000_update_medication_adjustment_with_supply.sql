-- Update medication adjustment logic to handle supply field and calculate next prescription due

-- First, add supply_days field to visit_medication_adjustments table
ALTER TABLE visit_medication_adjustments 
ADD COLUMN new_supply_days INTEGER;

-- Add index for the new supply_days field
CREATE INDEX idx_visit_medication_adjustments_supply_days 
ON visit_medication_adjustments(new_supply_days);

-- Add comment to document the field
COMMENT ON COLUMN visit_medication_adjustments.new_supply_days IS 'Number of days of medication supply when approved via medication adjustments';

-- Create or replace trigger function to update preferences when medication adjustments are made
CREATE OR REPLACE FUNCTION update_preference_on_medication_adjustment()
RETURNS TRIGGER AS $$
DECLARE
    v_fax_date DATE;
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
        
        -- If supply_days was provided, calculate and update next_prescription_due
        -- using the most recent fax date for this preference
        IF NEW.new_supply_days IS NOT NULL AND NEW.new_supply_days > 0 THEN
            -- Get the most recent fax date for this preference
            SELECT faxed_at::date 
            INTO v_fax_date
            FROM faxes 
            WHERE preference_id = NEW.preference_id 
              AND fax_status = 'delivered'
            ORDER BY faxed_at DESC 
            LIMIT 1;
            
            -- If we have a fax date, calculate next due date
            IF v_fax_date IS NOT NULL THEN
                v_calculated_due_date := v_fax_date + NEW.new_supply_days;
                
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
                    'Updated next prescription due based on fax date and supply',
                    jsonb_build_object(
                        'preference_id', NEW.preference_id,
                        'fax_date', v_fax_date,
                        'supply_days', NEW.new_supply_days,
                        'calculated_due_date', v_calculated_due_date
                    )
                );
            ELSE
                -- Log that no fax date was found
                INSERT INTO auth_trigger_logs (
                    step, 
                    status, 
                    message, 
                    metadata
                ) VALUES (
                    'SUPPLY_CALCULATION', 
                    'WARNING', 
                    'No delivered fax found for preference, cannot calculate next due date',
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

-- Create trigger on visit_medication_adjustments
DROP TRIGGER IF EXISTS update_preference_on_adjustment_trigger ON visit_medication_adjustments;
CREATE TRIGGER update_preference_on_adjustment_trigger
    AFTER INSERT ON visit_medication_adjustments
    FOR EACH ROW
    EXECUTE FUNCTION update_preference_on_medication_adjustment();

-- Add comment to the trigger
COMMENT ON TRIGGER update_preference_on_adjustment_trigger ON visit_medication_adjustments IS 'Updates patient_medication_preferences when medication adjustments are approved, including supply_days and next_prescription_due calculation';

-- Create function to manually update next prescription due for existing preferences with supply
CREATE OR REPLACE FUNCTION update_next_due_from_supply_and_fax()
RETURNS INTEGER AS $$
DECLARE
    preference_record RECORD;
    v_fax_date DATE;
    v_calculated_due_date DATE;
    v_updated_count INTEGER := 0;
BEGIN
    -- Loop through all preferences that have supply_days but no next_prescription_due
    FOR preference_record IN 
        SELECT id, supply_days
        FROM patient_medication_preferences 
        WHERE supply_days IS NOT NULL 
          AND supply_days > 0 
          AND (next_prescription_due IS NULL OR next_prescription_due < CURRENT_DATE)
    LOOP
        -- Get the most recent delivered fax for this preference
        SELECT faxed_at::date 
        INTO v_fax_date
        FROM faxes 
        WHERE preference_id = preference_record.id 
          AND fax_status = 'delivered'
        ORDER BY faxed_at DESC 
        LIMIT 1;
        
        -- If we have a fax date, calculate and update
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

-- Add comment to the maintenance function
COMMENT ON FUNCTION update_next_due_from_supply_and_fax() IS 'Updates next_prescription_due for preferences with supply_days based on most recent delivered fax date';