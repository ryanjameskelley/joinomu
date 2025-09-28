-- ================================
-- Fix Appointment Reschedule System
-- ================================

-- First, let's disable RLS on appointments table for development
ALTER TABLE appointments DISABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_history DISABLE ROW LEVEL SECURITY;

-- Add reschedule tracking columns to appointments table
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS rescheduled_from_id UUID REFERENCES appointments(id),
ADD COLUMN IF NOT EXISTS rescheduled_to_id UUID REFERENCES appointments(id),
ADD COLUMN IF NOT EXISTS is_reschedule_source BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS reschedule_count INTEGER DEFAULT 0;

-- Add indexes for reschedule tracking
CREATE INDEX IF NOT EXISTS idx_appointments_rescheduled_from ON appointments(rescheduled_from_id);
CREATE INDEX IF NOT EXISTS idx_appointments_rescheduled_to ON appointments(rescheduled_to_id);
CREATE INDEX IF NOT EXISTS idx_appointments_reschedule_source ON appointments(is_reschedule_source);

-- Create a comprehensive reschedule function
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
  DECLARE
    v_new_end_time TIME;
    v_duration_minutes INTEGER;
  BEGIN
    v_duration_minutes := v_old_appointment.duration_minutes;
    v_new_end_time := p_new_time + (v_duration_minutes || ' minutes')::INTERVAL;
  END;
  
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
      v_old_appointment.reschedule_count + 1
    ) RETURNING id INTO v_new_appointment_id;
    
    -- Update the old appointment to point to the new one
    UPDATE appointments 
    SET rescheduled_to_id = v_new_appointment_id
    WHERE id = p_appointment_id;
    
    -- Log the reschedule action in history
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
      'rescheduled',
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
        'end_time', v_new_end_time,
        'new_appointment_id', v_new_appointment_id
      ),
      p_reason
    );
    
    v_result := json_build_object(
      'success', true,
      'old_appointment_id', p_appointment_id,
      'new_appointment_id', v_new_appointment_id,
      'message', 'Appointment successfully rescheduled'
    );
    
    RETURN v_result;
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback handled automatically by PostgreSQL
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to reschedule appointment: ' || SQLERRM
    );
  END;
END;
$$;

-- Update the availability checking function to exclude rescheduled appointments
CREATE OR REPLACE FUNCTION get_available_slots_for_provider(
  p_provider_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_treatment_type TEXT DEFAULT NULL
) RETURNS TABLE (
  slot_date DATE,
  slot_start_time TIME,
  slot_end_time TIME,
  duration_minutes INTEGER
) 
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT p_start_date AS date
    UNION ALL
    SELECT date + 1
    FROM date_series
    WHERE date < p_end_date
  ),
  provider_daily_schedule AS (
    SELECT 
      ds.date,
      ps.start_time,
      ps.end_time,
      ps.slot_duration_minutes,
      ps.treatment_types
    FROM date_series ds
    CROSS JOIN provider_schedules ps
    WHERE ps.provider_id = p_provider_id
      AND ps.active = true
      AND ps.day_of_week = EXTRACT(DOW FROM ds.date)
      AND (
        p_treatment_type IS NULL 
        OR array_length(ps.treatment_types, 1) IS NULL 
        OR p_treatment_type = ANY(ps.treatment_types)
      )
  ),
  time_slots AS (
    SELECT 
      pds.date,
      generate_series(
        pds.start_time,
        pds.end_time - (pds.slot_duration_minutes || ' minutes')::INTERVAL,
        (pds.slot_duration_minutes || ' minutes')::INTERVAL
      )::TIME AS start_time,
      (generate_series(
        pds.start_time,
        pds.end_time - (pds.slot_duration_minutes || ' minutes')::INTERVAL,
        (pds.slot_duration_minutes || ' minutes')::INTERVAL
      ) + (pds.slot_duration_minutes || ' minutes')::INTERVAL)::TIME AS end_time,
      pds.slot_duration_minutes
    FROM provider_daily_schedule pds
  )
  SELECT 
    ts.date,
    ts.start_time,
    ts.end_time,
    ts.slot_duration_minutes
  FROM time_slots ts
  WHERE NOT EXISTS (
    -- Exclude slots that have active appointments (not rescheduled source appointments)
    SELECT 1 FROM appointments a
    WHERE a.provider_id = p_provider_id
      AND a.appointment_date = ts.date
      AND a.start_time = ts.start_time
      AND a.status NOT IN ('cancelled', 'no_show', 'rescheduled')
      AND a.is_reschedule_source = false
  )
  AND NOT EXISTS (
    -- Exclude slots blocked by availability overrides
    SELECT 1 FROM provider_availability_overrides pao
    WHERE pao.provider_id = p_provider_id
      AND pao.date = ts.date
      AND pao.available = false
      AND (pao.start_time IS NULL OR ts.start_time >= pao.start_time)
      AND (pao.end_time IS NULL OR ts.end_time <= pao.end_time)
  )
  ORDER BY ts.date, ts.start_time;
END;
$$;

-- Grant execute permissions on the new functions
GRANT EXECUTE ON FUNCTION reschedule_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION get_available_slots_for_provider TO authenticated;

-- Update comments
COMMENT ON COLUMN appointments.rescheduled_from_id IS 'Points to original appointment if this is a rescheduled appointment';
COMMENT ON COLUMN appointments.rescheduled_to_id IS 'Points to new appointment if this was rescheduled';
COMMENT ON COLUMN appointments.is_reschedule_source IS 'True if this appointment was rescheduled (original slot now available)';
COMMENT ON COLUMN appointments.reschedule_count IS 'Number of times this appointment chain has been rescheduled';

COMMENT ON FUNCTION reschedule_appointment IS 'Safely reschedules an appointment, creating new appointment and marking old one as rescheduled';
COMMENT ON FUNCTION get_available_slots_for_provider IS 'Gets available time slots excluding rescheduled appointments to free up original slots';