-- Update preference trigger to reset refill_requested flag when approved
-- This ensures the flag is reset for next refill cycle

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
    
    -- Reset refill_requested flag when status changes to approved
    IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
        NEW.refill_requested := FALSE;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add comment about the updated trigger functionality
COMMENT ON FUNCTION calculate_next_prescription_due() IS 'Calculates next_prescription_due when supply_days is updated with approved status, and resets refill_requested flag on approval';