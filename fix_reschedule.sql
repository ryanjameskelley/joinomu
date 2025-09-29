-- Create reschedule_appointment function if it doesn't exist
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
      AND a.id != p_appointment_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Selected time slot is already booked'
    );
  END IF;
  
  -- Calculate new end time (preserve original duration)
  v_duration_minutes := COALESCE(v_old_appointment.duration_minutes, 30);
  v_new_end_time := p_new_time + (v_duration_minutes || ' minutes')::INTERVAL;
  
  -- Start transaction
  BEGIN
    -- Mark the original appointment as rescheduled
    UPDATE appointments 
    SET 
      status = 'rescheduled',
      updated_at = NOW()
    WHERE id = p_appointment_id;
    
    -- Create new appointment
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
      booked_by_user_id
    ) VALUES (
      v_old_appointment.patient_id,
      v_old_appointment.provider_id,
      v_old_appointment.assignment_id,
      p_new_date,
      p_new_time,
      v_new_end_time,
      v_duration_minutes,
      v_old_appointment.treatment_type,
      v_old_appointment.appointment_type,
      'scheduled',
      v_old_appointment.patient_notes,
      v_old_appointment.provider_notes,
      'Rescheduled from ' || v_old_appointment.appointment_date || ' ' || v_old_appointment.start_time,
      p_rescheduled_by,
      p_rescheduled_by_user_id
    ) RETURNING id INTO v_new_appointment_id;
    
    -- Return success
    RETURN json_build_object(
      'success', true,
      'old_appointment_id', p_appointment_id,
      'new_appointment_id', v_new_appointment_id,
      'message', 'Appointment successfully rescheduled'
    );
    
  EXCEPTION WHEN OTHERS THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to reschedule appointment: ' || SQLERRM
    );
  END;
END;
$$;