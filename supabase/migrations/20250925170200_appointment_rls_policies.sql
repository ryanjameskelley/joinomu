-- ================================
-- JoinOmu Appointment System - Phase 1
-- Row Level Security Policies
-- ================================

-- ================================
-- 1. Enable RLS on All Tables
-- ================================

ALTER TABLE provider_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE provider_availability_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_history ENABLE ROW LEVEL SECURITY;

-- ================================
-- 2. Provider Schedule Policies
-- ================================

-- Providers can manage their own schedules
CREATE POLICY provider_own_schedule_policy ON provider_schedules
FOR ALL USING (
  provider_id IN (
    SELECT pr.id FROM providers pr
    WHERE pr.profile_id = auth.uid()
  )
);

-- Patients can view schedules of their assigned providers
CREATE POLICY patient_view_provider_schedules ON provider_schedules
FOR SELECT USING (
  provider_id IN (
    SELECT pa.provider_id 
    FROM patient_assignments pa
    INNER JOIN patients p ON pa.patient_id = p.id
    WHERE p.profile_id = auth.uid() 
      AND pa.active = true
  )
);

-- Admins can view all provider schedules
CREATE POLICY admin_view_all_schedules ON provider_schedules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins a
    WHERE a.profile_id = auth.uid() 
      AND a.active = true
  )
);

-- ================================
-- 3. Provider Availability Override Policies
-- ================================

-- Providers can manage their own availability overrides
CREATE POLICY provider_own_overrides_policy ON provider_availability_overrides
FOR ALL USING (
  provider_id IN (
    SELECT pr.id FROM providers pr
    WHERE pr.profile_id = auth.uid()
  )
);

-- Patients can view overrides for their assigned providers (for booking)
CREATE POLICY patient_view_provider_overrides ON provider_availability_overrides
FOR SELECT USING (
  provider_id IN (
    SELECT pa.provider_id 
    FROM patient_assignments pa
    INNER JOIN patients p ON pa.patient_id = p.id
    WHERE p.profile_id = auth.uid() 
      AND pa.active = true
  )
);

-- Admins can view all availability overrides
CREATE POLICY admin_view_all_overrides ON provider_availability_overrides
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins a
    WHERE a.profile_id = auth.uid() 
      AND a.active = true
  )
);

-- ================================
-- 4. Core Appointments Policies
-- ================================

-- Patients can view and book their own appointments
CREATE POLICY patient_own_appointments ON appointments
FOR ALL USING (
  patient_id IN (
    SELECT p.id FROM patients p
    WHERE p.profile_id = auth.uid()
  )
);

-- Additional patient booking restrictions
CREATE POLICY patient_booking_restrictions ON appointments
FOR INSERT WITH CHECK (
  -- Patient can only book for themselves
  patient_id IN (
    SELECT p.id FROM patients p
    WHERE p.profile_id = auth.uid()
  )
  AND
  -- Can only book with assigned providers
  provider_id IN (
    SELECT pa.provider_id 
    FROM patient_assignments pa
    INNER JOIN patients p ON pa.patient_id = p.id
    WHERE p.profile_id = auth.uid() 
      AND pa.active = true
  )
  AND
  -- Cannot book in the past
  (appointment_date > CURRENT_DATE OR 
   (appointment_date = CURRENT_DATE AND start_time > LOCALTIME))
  AND
  -- Cannot book too far in advance (90 days)
  appointment_date <= CURRENT_DATE + INTERVAL '90 days'
  AND
  -- Must specify correct booked_by
  booked_by = 'patient'
);

-- Patients cannot directly delete appointments, only cancel
CREATE POLICY patient_no_delete_appointments ON appointments
FOR DELETE USING (false);

-- Providers can view and manage appointments with their patients
CREATE POLICY provider_own_appointments ON appointments
FOR ALL USING (
  provider_id IN (
    SELECT pr.id FROM providers pr
    WHERE pr.profile_id = auth.uid()
  )
);

-- Providers cannot delete appointments, only cancel
CREATE POLICY provider_no_delete_appointments ON appointments
FOR DELETE USING (false);

-- Admins have full access to all appointments
CREATE POLICY admin_full_appointments_access ON appointments
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins a
    WHERE a.profile_id = auth.uid() 
      AND a.active = true
  )
);

-- ================================
-- 5. Appointment History Policies  
-- ================================

-- Patients can view history of their own appointments
CREATE POLICY patient_view_own_appointment_history ON appointment_history
FOR SELECT USING (
  appointment_id IN (
    SELECT a.id FROM appointments a
    INNER JOIN patients p ON a.patient_id = p.id
    WHERE p.profile_id = auth.uid()
  )
);

-- Providers can view history of their appointments
CREATE POLICY provider_view_appointment_history ON appointment_history
FOR SELECT USING (
  appointment_id IN (
    SELECT a.id FROM appointments a
    INNER JOIN providers pr ON a.provider_id = pr.id
    WHERE pr.profile_id = auth.uid()
  )
);

-- Admins can view all appointment history
CREATE POLICY admin_view_all_appointment_history ON appointment_history
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins a
    WHERE a.profile_id = auth.uid() 
      AND a.active = true
  )
);

-- History is read-only for users (only system/triggers can insert)
CREATE POLICY appointment_history_readonly ON appointment_history
FOR INSERT WITH CHECK (false);

-- ================================
-- 6. Additional Security Constraints
-- ================================

-- Function to validate appointment business rules
CREATE OR REPLACE FUNCTION validate_appointment_business_rules()
RETURNS TRIGGER AS $$
BEGIN
  -- Prevent booking conflicts
  IF EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.provider_id = NEW.provider_id
      AND a.appointment_date = NEW.appointment_date
      AND a.start_time = NEW.start_time
      AND a.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND a.status NOT IN ('cancelled', 'no_show')
  ) THEN
    RAISE EXCEPTION 'Appointment slot already booked';
  END IF;
  
  -- Validate appointment is within provider's schedule
  IF NOT EXISTS (
    SELECT 1 FROM provider_schedules ps
    WHERE ps.provider_id = NEW.provider_id
      AND ps.day_of_week = EXTRACT(DOW FROM NEW.appointment_date)
      AND ps.start_time <= NEW.start_time
      AND ps.end_time >= NEW.end_time
      AND ps.active = true
  ) THEN
    RAISE EXCEPTION 'Appointment outside provider schedule';
  END IF;
  
  -- Check for availability overrides that block this time
  IF EXISTS (
    SELECT 1 FROM provider_availability_overrides pao
    WHERE pao.provider_id = NEW.provider_id
      AND pao.date = NEW.appointment_date
      AND pao.available = false
      AND (pao.start_time IS NULL OR NEW.start_time >= pao.start_time)
      AND (pao.end_time IS NULL OR NEW.end_time <= pao.end_time)
  ) THEN
    RAISE EXCEPTION 'Provider not available at requested time';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_business_rules_trigger
  BEFORE INSERT OR UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION validate_appointment_business_rules();

-- ================================
-- 7. Grant Table Permissions
-- ================================

-- Grant appropriate permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON provider_schedules TO authenticated;
GRANT SELECT, INSERT, UPDATE ON provider_availability_overrides TO authenticated;
GRANT SELECT, INSERT, UPDATE ON appointments TO authenticated;
GRANT SELECT ON appointment_history TO authenticated;

-- Grant usage on sequences
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- ================================
-- 8. Policy Comments
-- ================================

COMMENT ON POLICY patient_own_appointments ON appointments IS 'Patients can only access their own appointments';
COMMENT ON POLICY provider_own_appointments ON appointments IS 'Providers can manage appointments with their patients';
COMMENT ON POLICY admin_full_appointments_access ON appointments IS 'Admins have full access to all appointment data';
COMMENT ON POLICY patient_booking_restrictions ON appointments IS 'Enforces business rules for patient appointment booking';
COMMENT ON POLICY appointment_history_readonly ON appointment_history IS 'History is maintained by system triggers only';