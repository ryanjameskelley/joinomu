-- Create function to handle refill requests
-- This function changes approved preferences back to pending when patient requests a refill

CREATE OR REPLACE FUNCTION request_prescription_refill(
    p_preference_id UUID,
    p_patient_profile_id UUID
) RETURNS JSON AS $$
DECLARE
    v_preference_record RECORD;
    v_patient_id UUID;
    v_days_until_due INTEGER;
    v_result JSON;
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
    
    -- Update preference status to pending
    UPDATE patient_medication_preferences 
    SET 
        status = 'pending',
        notes = COALESCE(notes, '') || 
                CASE 
                    WHEN notes IS NULL OR notes = '' THEN 
                        'Refill requested on ' || CURRENT_DATE::text
                    ELSE 
                        '; Refill requested on ' || CURRENT_DATE::text
                END,
        updated_at = NOW()
    WHERE id = p_preference_id;
    
    -- Log the refill request
    INSERT INTO auth_trigger_logs (
        step, 
        status, 
        message, 
        metadata
    ) VALUES (
        'REFILL_REQUEST', 
        'SUCCESS', 
        'Patient requested prescription refill',
        json_build_object(
            'preference_id', p_preference_id,
            'patient_profile_id', p_patient_profile_id,
            'days_until_due', v_days_until_due,
            'due_date', v_preference_record.next_prescription_due,
            'medication_id', v_preference_record.medication_id
        )
    );
    
    RETURN json_build_object(
        'success', true,
        'message', 'Refill request submitted successfully',
        'preference_id', p_preference_id,
        'new_status', 'pending',
        'days_until_due', v_days_until_due
    );
    
EXCEPTION WHEN OTHERS THEN
    -- Log the error
    INSERT INTO auth_trigger_logs (
        step, 
        status, 
        message, 
        metadata
    ) VALUES (
        'REFILL_REQUEST', 
        'ERROR', 
        'Refill request failed: ' || SQLERRM,
        json_build_object(
            'preference_id', p_preference_id,
            'patient_profile_id', p_patient_profile_id,
            'error', SQLERRM
        )
    );
    
    RETURN json_build_object(
        'success', false,
        'error', 'An error occurred while processing the refill request'
    );
END;
$$ LANGUAGE plpgsql;

-- Add comment to the function
COMMENT ON FUNCTION request_prescription_refill(UUID, UUID) IS 'Allows patients to request prescription refills within 3 days of due date, changing status from approved to pending';

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION request_prescription_refill(UUID, UUID) TO authenticated;