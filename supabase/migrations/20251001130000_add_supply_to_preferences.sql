-- Add supply field to patient_medication_preferences table
-- This will store the number of days of medication supply when approved

ALTER TABLE patient_medication_preferences 
ADD COLUMN supply_days INTEGER;

-- Add index for the new supply_days field for query performance
CREATE INDEX idx_patient_medication_preferences_supply_days 
ON patient_medication_preferences(supply_days);

-- Add comment to document the field
COMMENT ON COLUMN patient_medication_preferences.supply_days IS 'Number of days of medication supply when approved via medication adjustments';

-- Update the existing calculate_next_prescription_due function to use supply_days from preferences
CREATE OR REPLACE FUNCTION calculate_next_prescription_due(
    p_preference_id UUID,
    p_delivery_date DATE,
    p_frequency TEXT DEFAULT NULL
) RETURNS DATE AS $$
DECLARE
    v_supply_days INTEGER;
    v_frequency TEXT;
    v_next_due_date DATE;
BEGIN
    -- Get supply_days and frequency from the preference
    SELECT supply_days, frequency 
    INTO v_supply_days, v_frequency
    FROM patient_medication_preferences 
    WHERE id = p_preference_id;
    
    -- Use provided frequency if given, otherwise use the preference frequency
    IF p_frequency IS NOT NULL THEN
        v_frequency := p_frequency;
    END IF;
    
    -- If supply_days is set, use it directly
    IF v_supply_days IS NOT NULL AND v_supply_days > 0 THEN
        v_next_due_date := p_delivery_date + v_supply_days;
    ELSE
        -- Fall back to frequency-based calculation
        CASE 
            WHEN v_frequency = 'daily' THEN
                v_next_due_date := p_delivery_date + INTERVAL '30 days';
            WHEN v_frequency = 'weekly' THEN
                v_next_due_date := p_delivery_date + INTERVAL '12 weeks';
            WHEN v_frequency = 'monthly' THEN
                v_next_due_date := p_delivery_date + INTERVAL '3 months';
            WHEN v_frequency = 'quarterly' THEN
                v_next_due_date := p_delivery_date + INTERVAL '3 months';
            ELSE
                -- Default to 30 days if frequency not recognized
                v_next_due_date := p_delivery_date + INTERVAL '30 days';
        END CASE;
    END IF;
    
    RETURN v_next_due_date;
END;
$$ LANGUAGE plpgsql;

-- Add comment to the updated function
COMMENT ON FUNCTION calculate_next_prescription_due(UUID, DATE, TEXT) IS 'Calculate next prescription due date using supply_days from preferences if available, otherwise fall back to frequency-based calculation';