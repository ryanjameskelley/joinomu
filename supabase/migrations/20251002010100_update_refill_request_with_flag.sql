-- Update refill request function to set refill_requested = TRUE
-- This ensures only patient-requested refills appear in provider approval queue

CREATE OR REPLACE FUNCTION request_prescription_refill(
    p_preference_id UUID,
    p_patient_profile_id UUID
) RETURNS JSON AS $$
DECLARE
    v_preference_record RECORD;
    v_patient_id UUID;
    v_days_until_due INTEGER;
BEGIN
    -- Get patient ID from profile
    SELECT id INTO v_patient_id 
    FROM patients 
    WHERE profile_id = p_patient_profile_id;
    
    IF v_patient_id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Patient not found'
        );
    END IF;
    
    -- Get the preference record
    SELECT 
        id, 
        patient_id, 
        status, 
        next_prescription_due,
        medication_id,
        preferred_dosage,
        frequency
    INTO v_preference_record
    FROM patient_medication_preferences 
    WHERE id = p_preference_id 
      AND patient_id = v_patient_id;
    
    IF v_preference_record.id IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Medication preference not found or access denied'
        );
    END IF;
    
    -- Check if preference is currently approved
    IF v_preference_record.status != 'approved' THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Can only request refills for approved medications'
        );
    END IF;
    
    -- Check if next_prescription_due exists
    IF v_preference_record.next_prescription_due IS NULL THEN
        RETURN json_build_object(
            'success', false,
            'error', 'No prescription due date found'
        );
    END IF;
    
    -- Calculate days until due
    v_days_until_due := v_preference_record.next_prescription_due::date - CURRENT_DATE;
    
    -- Only allow refill requests within 3 days of due date (or past due)
    IF v_days_until_due > 3 THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Refill can only be requested within 3 days of due date'
        );
    END IF;
    
    -- Update preference status to pending AND set refill_requested = TRUE
    UPDATE patient_medication_preferences 
    SET 
        status = 'pending',
        refill_requested = TRUE,  -- Mark as patient-requested refill
        notes = COALESCE(notes, '') || 
                CASE 
                    WHEN notes IS NULL OR notes = '' THEN 
                        'Refill requested on ' || CURRENT_DATE::text
                    ELSE 
                        '; Refill requested on ' || CURRENT_DATE::text
                END,
        updated_at = NOW()
    WHERE id = p_preference_id;
    
    RETURN json_build_object(
        'success', true,
        'message', 'Refill request submitted successfully',
        'preference_id', p_preference_id,
        'new_status', 'pending',
        'refill_requested', true,
        'days_until_due', v_days_until_due
    );
    
EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
        'success', false,
        'error', 'An error occurred while processing the refill request: ' || SQLERRM
    );
END;
$$ LANGUAGE plpgsql;

-- Add comment to the updated function
COMMENT ON FUNCTION request_prescription_refill(UUID, UUID) IS 'Allows patients to request prescription refills within 3 days of due date, sets refill_requested=TRUE for provider approval filtering';