-- ================================
-- JoinOmu Appointment System - Phase 1
-- Core RPC Functions
-- ================================

-- ================================
-- 1. Get Available Appointment Slots
-- ================================

CREATE OR REPLACE FUNCTION get_available_slots(
  p_provider_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_treatment_type TEXT DEFAULT NULL
) RETURNS TABLE(
  slot_date DATE,
  slot_start_time TIME,
  slot_end_time TIME,
  duration_minutes INTEGER
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_date_iter DATE;
  schedule_record RECORD;
  current_time_slot TIME;
  slot_start TIME;
  slot_end TIME;
  is_available BOOLEAN;
BEGIN
  -- Validate inputs
  IF p_start_date > p_end_date THEN
    RAISE EXCEPTION 'Start date cannot be after end date';
  END IF;
  
  IF p_end_date > CURRENT_DATE + INTERVAL '90 days' THEN
    RAISE EXCEPTION 'Cannot book more than 90 days in advance';
  END IF;

  -- Loop through each date in the range
  current_date_iter := p_start_date;
  
  WHILE current_date_iter <= p_end_date LOOP
    -- Get provider's schedule for this day of week
    FOR schedule_record IN 
      SELECT ps.start_time, ps.end_time, ps.slot_duration_minutes, ps.treatment_types
      FROM provider_schedules ps
      WHERE ps.provider_id = p_provider_id
        AND ps.day_of_week = EXTRACT(DOW FROM current_date_iter)
        AND ps.active = true
        AND (p_treatment_type IS NULL OR p_treatment_type = ANY(ps.treatment_types) OR array_length(ps.treatment_types, 1) IS NULL)
    LOOP
      
      -- Check for availability overrides on this date
      SELECT po.available INTO is_available
      FROM provider_availability_overrides po
      WHERE po.provider_id = p_provider_id
        AND po.date = current_date_iter
        AND po.start_time <= schedule_record.start_time
        AND po.end_time >= schedule_record.end_time
      LIMIT 1;
      
      -- If override exists and marks as unavailable, skip this schedule block
      IF is_available = false THEN
        CONTINUE;
      END IF;
      
      -- Generate time slots for this schedule block
      current_time_slot := schedule_record.start_time;
      
      WHILE current_time_slot + INTERVAL '1 minute' * schedule_record.slot_duration_minutes <= schedule_record.end_time LOOP
        slot_start := current_time_slot;
        slot_end := current_time_slot + INTERVAL '1 minute' * schedule_record.slot_duration_minutes;
        
        -- Check if this slot is already booked
        IF NOT EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.provider_id = p_provider_id
            AND a.appointment_date = current_date_iter
            AND a.start_time = slot_start
            AND a.status NOT IN ('cancelled', 'no_show')
        ) THEN
          -- Return this available slot
          slot_date := current_date_iter;
          slot_start_time := slot_start;
          slot_end_time := slot_end;
          duration_minutes := schedule_record.slot_duration_minutes;
          
          RETURN NEXT;
        END IF;
        
        -- Move to next slot
        current_time_slot := current_time_slot + INTERVAL '1 minute' * schedule_record.slot_duration_minutes;
      END LOOP;
      
    END LOOP;
    
    current_date_iter := current_date_iter + INTERVAL '1 day';
  END LOOP;
  
  RETURN;
END;
$$;

-- ================================
-- 2. Get Patient Appointments
-- ================================

CREATE OR REPLACE FUNCTION get_patient_appointments(
  p_patient_profile_id UUID,
  p_include_past BOOLEAN DEFAULT false
) RETURNS TABLE(
  appointment_id UUID,
  provider_name TEXT,
  provider_specialty TEXT,
  appointment_date DATE,
  start_time TIME,
  end_time TIME,
  treatment_type TEXT,
  appointment_type TEXT,
  status TEXT,
  patient_notes TEXT,
  provider_notes TEXT,
  can_cancel BOOLEAN,
  can_reschedule BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as appointment_id,
    (prof.first_name || ' ' || prof.last_name) as provider_name,
    prov.specialty as provider_specialty,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.treatment_type,
    a.appointment_type,
    a.status,
    a.patient_notes,
    a.provider_notes,
    -- Can cancel if appointment is scheduled/confirmed and at least 24 hours away
    CASE 
      WHEN a.status IN ('scheduled', 'confirmed') 
        AND (a.appointment_date > CURRENT_DATE + INTERVAL '1 day' 
             OR (a.appointment_date = CURRENT_DATE + INTERVAL '1 day' AND a.start_time > LOCALTIME))
      THEN true
      ELSE false
    END as can_cancel,
    -- Can reschedule if appointment is scheduled/confirmed and at least 48 hours away
    CASE 
      WHEN a.status IN ('scheduled', 'confirmed') 
        AND (a.appointment_date > CURRENT_DATE + INTERVAL '2 days'
             OR (a.appointment_date = CURRENT_DATE + INTERVAL '2 days' AND a.start_time > LOCALTIME))
      THEN true
      ELSE false
    END as can_reschedule,
    a.created_at
  FROM appointments a
  INNER JOIN patients p ON a.patient_id = p.id
  INNER JOIN providers prov ON a.provider_id = prov.id
  INNER JOIN profiles prof ON prov.profile_id = prof.id
  WHERE p.profile_id = p_patient_profile_id
    AND (p_include_past = true OR a.appointment_date >= CURRENT_DATE)
  ORDER BY a.appointment_date ASC, a.start_time ASC;
END;
$$;

-- ================================
-- 3. Book Appointment Function
-- ================================

CREATE OR REPLACE FUNCTION book_appointment(
  p_patient_profile_id UUID,
  p_provider_id UUID,
  p_appointment_date DATE,
  p_start_time TIME,
  p_treatment_type TEXT,
  p_appointment_type TEXT DEFAULT 'consultation',
  p_booked_by TEXT DEFAULT 'patient',
  p_patient_notes TEXT DEFAULT NULL
) RETURNS TABLE(
  success BOOLEAN,
  appointment_id UUID,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_patient_id UUID;
  v_assignment_id UUID;
  v_duration_minutes INTEGER;
  v_end_time TIME;
  v_new_appointment_id UUID;
BEGIN
  -- Get patient ID from profile ID
  SELECT p.id INTO v_patient_id
  FROM patients p
  WHERE p.profile_id = p_patient_profile_id;
  
  IF v_patient_id IS NULL THEN
    success := false;
    appointment_id := NULL;
    message := 'Patient not found';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Verify patient-provider relationship exists
  SELECT pa.id INTO v_assignment_id
  FROM patient_assignments pa
  WHERE pa.patient_id = v_patient_id
    AND pa.provider_id = p_provider_id
    AND pa.active = true
  LIMIT 1;
  
  IF v_assignment_id IS NULL THEN
    success := false;
    appointment_id := NULL;
    message := 'No active assignment between patient and provider';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check if the requested slot is available
  SELECT ps.slot_duration_minutes INTO v_duration_minutes
  FROM provider_schedules ps
  WHERE ps.provider_id = p_provider_id
    AND ps.day_of_week = EXTRACT(DOW FROM p_appointment_date)
    AND ps.start_time <= p_start_time
    AND ps.end_time >= p_start_time + INTERVAL '30 minutes' -- minimum slot
    AND ps.active = true
    AND (p_treatment_type = ANY(ps.treatment_types) OR array_length(ps.treatment_types, 1) IS NULL)
  LIMIT 1;
  
  IF v_duration_minutes IS NULL THEN
    success := false;
    appointment_id := NULL;
    message := 'Provider not available at requested time';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Calculate end time
  v_end_time := p_start_time + INTERVAL '1 minute' * v_duration_minutes;
  
  -- Check for scheduling conflicts
  IF EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.provider_id = p_provider_id
      AND a.appointment_date = p_appointment_date
      AND a.start_time = p_start_time
      AND a.status NOT IN ('cancelled', 'no_show')
  ) THEN
    success := false;
    appointment_id := NULL;
    message := 'Time slot already booked';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check for availability overrides
  IF EXISTS (
    SELECT 1 FROM provider_availability_overrides pao
    WHERE pao.provider_id = p_provider_id
      AND pao.date = p_appointment_date
      AND pao.available = false
      AND (pao.start_time IS NULL OR p_start_time >= pao.start_time)
      AND (pao.end_time IS NULL OR v_end_time <= pao.end_time)
  ) THEN
    success := false;
    appointment_id := NULL;
    message := 'Provider not available on requested date';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Create the appointment
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
    booked_by,
    booked_by_user_id
  ) VALUES (
    v_patient_id,
    p_provider_id,
    v_assignment_id,
    p_appointment_date,
    p_start_time,
    v_end_time,
    v_duration_minutes,
    p_treatment_type,
    p_appointment_type,
    'scheduled',
    p_patient_notes,
    p_booked_by,
    p_patient_profile_id
  ) RETURNING id INTO v_new_appointment_id;
  
  -- Return success
  success := true;
  appointment_id := v_new_appointment_id;
  message := 'Appointment booked successfully';
  RETURN NEXT;
  RETURN;
  
EXCEPTION
  WHEN OTHERS THEN
    success := false;
    appointment_id := NULL;
    message := 'Error booking appointment: ' || SQLERRM;
    RETURN NEXT;
    RETURN;
END;
$$;

-- ================================
-- 4. Cancel Appointment Function
-- ================================

CREATE OR REPLACE FUNCTION cancel_appointment(
  p_appointment_id UUID,
  p_cancelled_by TEXT,
  p_cancelled_by_user_id UUID,
  p_cancellation_reason TEXT
) RETURNS TABLE(
  success BOOLEAN,
  message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_appointment RECORD;
BEGIN
  -- Get appointment details
  SELECT * INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id;
  
  IF NOT FOUND THEN
    success := false;
    message := 'Appointment not found';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check if appointment can be cancelled
  IF v_appointment.status NOT IN ('scheduled', 'confirmed') THEN
    success := false;
    message := 'Appointment cannot be cancelled in current status: ' || v_appointment.status;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Update appointment status
  UPDATE appointments
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    cancelled_by_user_id = p_cancelled_by_user_id,
    cancellation_reason = p_cancellation_reason
  WHERE id = p_appointment_id;
  
  success := true;
  message := 'Appointment cancelled successfully';
  RETURN NEXT;
  RETURN;
  
EXCEPTION
  WHEN OTHERS THEN
    success := false;
    message := 'Error cancelling appointment: ' || SQLERRM;
    RETURN NEXT;
    RETURN;
END;
$$;

-- ================================
-- 5. Admin Overview Functions
-- ================================

CREATE OR REPLACE FUNCTION get_admin_appointment_overview(
  p_date_range_start DATE DEFAULT CURRENT_DATE,
  p_date_range_end DATE DEFAULT CURRENT_DATE + INTERVAL '7 days',
  p_provider_id UUID DEFAULT NULL,
  p_patient_id UUID DEFAULT NULL
) RETURNS TABLE(
  appointment_id UUID,
  patient_name TEXT,
  provider_name TEXT,
  appointment_date DATE,
  start_time TIME,
  end_time TIME,
  treatment_type TEXT,
  appointment_type TEXT,
  status TEXT,
  last_updated TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as appointment_id,
    (patient_prof.first_name || ' ' || patient_prof.last_name) as patient_name,
    (provider_prof.first_name || ' ' || provider_prof.last_name) as provider_name,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.treatment_type,
    a.appointment_type,
    a.status,
    a.updated_at as last_updated
  FROM appointments a
  INNER JOIN patients p ON a.patient_id = p.id
  INNER JOIN profiles patient_prof ON p.profile_id = patient_prof.id
  INNER JOIN providers prov ON a.provider_id = prov.id
  INNER JOIN profiles provider_prof ON prov.profile_id = provider_prof.id
  WHERE a.appointment_date >= p_date_range_start
    AND a.appointment_date <= p_date_range_end
    AND (p_provider_id IS NULL OR a.provider_id = p_provider_id)
    AND (p_patient_id IS NULL OR a.patient_id = p_patient_id)
  ORDER BY a.appointment_date ASC, a.start_time ASC;
END;
$$;

-- ================================
-- 6. Set Security Context Helper
-- ================================

CREATE OR REPLACE FUNCTION set_appointment_context(
  p_user_role TEXT,
  p_user_id UUID
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM set_config('app.current_user_role', p_user_role, true);
  PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
END;
$$;

-- ================================
-- 7. Grant Permissions
-- ================================

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_available_slots TO authenticated;
GRANT EXECUTE ON FUNCTION get_patient_appointments TO authenticated;
GRANT EXECUTE ON FUNCTION book_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION cancel_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_appointment_overview TO authenticated;
GRANT EXECUTE ON FUNCTION set_appointment_context TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ================================
-- 8. Function Comments
-- ================================

COMMENT ON FUNCTION get_available_slots IS 'Returns available appointment slots for a provider within a date range';
COMMENT ON FUNCTION get_patient_appointments IS 'Gets all appointments for a patient with cancellation/reschedule permissions';
COMMENT ON FUNCTION book_appointment IS 'Books a new appointment with full validation';
COMMENT ON FUNCTION cancel_appointment IS 'Cancels an existing appointment with audit trail';
COMMENT ON FUNCTION get_admin_appointment_overview IS 'Admin dashboard view of appointments with filtering';
COMMENT ON FUNCTION set_appointment_context IS 'Sets security context for appointment operations';