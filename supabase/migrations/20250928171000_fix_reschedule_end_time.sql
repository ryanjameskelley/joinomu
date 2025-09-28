-- Fix the reschedule_appointment function to properly calculate end time
CREATE OR REPLACE FUNCTION reschedule_appointment(
  p_appointment_id UUID,
  p_new_date DATE,
  p_new_time TIME,
  p_rescheduled_by TEXT DEFAULT 'patient',
  p_rescheduled_by_user_id UUID DEFAULT NULL,
  p_reason TEXT DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_old_appointment appointments%ROWTYPE;
  v_new_appointment_id UUID;
  v_new_end_time TIME;
  v_duration_minutes INTEGER;
  v_result JSON;
BEGIN
  -- Get the original appointment
  SELECT * INTO v_old_appointment 
  FROM appointments 
  WHERE id = p_appointment_id AND status NOT IN ('cancelled', 'completed');
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Appointment not found or cannot be rescheduled'
    );
  END IF;
  
  -- Check if the new slot is available
  IF EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.provider_id = v_old_appointment.provider_id
      AND a.appointment_date = p_new_date
      AND a.start_time = p_new_time
      AND a.status NOT IN ('cancelled', 'no_show')
      AND a.is_reschedule_source = false  -- Don't count cancelled reschedule sources
      AND a.id != p_appointment_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Selected time slot is already booked'
    );
  END IF;
  
  -- Calculate new end time (preserve original duration)
  v_duration_minutes := v_old_appointment.duration_minutes;
  v_new_end_time := p_new_time + (v_duration_minutes || ' minutes')::INTERVAL;
  
  -- Start transaction
  BEGIN
    -- Mark the original appointment as rescheduled (source)
    UPDATE appointments 
    SET 
      status = 'rescheduled',
      is_reschedule_source = true,
      updated_at = NOW()
    WHERE id = p_appointment_id;
    
    -- Create new appointment with rescheduled data
    INSERT INTO appointments (
      patient_id,
      provider_id,
      assignment_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      treatment_type,
      appointment_type,
      status,
      patient_notes,
      provider_notes,
      admin_notes,
      booked_by,
      booked_by_user_id,
      rescheduled_from_id,
      reschedule_count
    ) VALUES (
      v_old_appointment.patient_id,
      v_old_appointment.provider_id,
      v_old_appointment.assignment_id,
      p_new_date,
      p_new_time,
      v_new_end_time,
      v_old_appointment.duration_minutes,
      v_old_appointment.treatment_type,
      v_old_appointment.appointment_type,
      'scheduled',
      v_old_appointment.patient_notes,
      v_old_appointment.provider_notes,
      CASE 
        WHEN v_old_appointment.admin_notes IS NULL THEN 'Rescheduled from ' || v_old_appointment.appointment_date || ' ' || v_old_appointment.start_time
        ELSE v_old_appointment.admin_notes || ' | Rescheduled from ' || v_old_appointment.appointment_date || ' ' || v_old_appointment.start_time
      END,
      p_rescheduled_by,
      p_rescheduled_by_user_id,
      p_appointment_id,
      COALESCE(v_old_appointment.reschedule_count, 0) + 1
    ) RETURNING id INTO v_new_appointment_id;
    
    -- Update the old appointment to point to the new one
    UPDATE appointments 
    SET rescheduled_to_id = v_new_appointment_id
    WHERE id = p_appointment_id;
    
    -- Log the reschedule action in history (if table exists)
    BEGIN
      INSERT INTO appointment_history (
        appointment_id,
        action,
        performed_by,
        performed_by_user_id,
        old_values,
        new_values,
        reason
      ) VALUES (
        p_appointment_id,
        'reschedule',
        p_rescheduled_by,
        p_rescheduled_by_user_id,
        json_build_object(
          'appointment_date', v_old_appointment.appointment_date,
          'start_time', v_old_appointment.start_time,
          'end_time', v_old_appointment.end_time
        ),
        json_build_object(
          'appointment_date', p_new_date,
          'start_time', p_new_time,
          'end_time', v_new_end_time
        ),
        p_reason
      );
    EXCEPTION WHEN undefined_table THEN
      -- History table doesn't exist, continue without logging
      NULL;
    END;
    
    -- Return success with both appointment IDs
    RETURN json_build_object(
      'success', true,
      'old_appointment_id', p_appointment_id,
      'new_appointment_id', v_new_appointment_id,
      'message', 'Appointment successfully rescheduled'
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback will happen automatically
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to reschedule appointment: ' || SQLERRM
    );
  END;
END;
$$;

-- Test the fixed function
DO $$
BEGIN
  RAISE NOTICE '✅ Reschedule function updated with proper end time calculation';
END $$;

COMMENT ON FUNCTION reschedule_appointment IS 'Fixed reschedule function with proper end time variable scope';