-- ================================
-- JoinOmu Appointment System - Phase 1
-- Core Database Schema
-- ================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- 1. Provider Availability System
-- ================================

-- Provider schedule templates (recurring weekly availability)
CREATE TABLE provider_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  slot_duration_minutes INTEGER NOT NULL DEFAULT 30 CHECK (slot_duration_minutes > 0),
  treatment_types TEXT[] DEFAULT '{}', -- specific treatments or empty array for all
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_time_range CHECK (end_time > start_time),
  CONSTRAINT unique_provider_schedule UNIQUE(provider_id, day_of_week, start_time, end_time)
);

-- Provider availability overrides for specific dates (vacations, special hours, etc.)
CREATE TABLE provider_availability_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  available BOOLEAN NOT NULL, -- false = unavailable/blocked, true = special availability
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  CONSTRAINT valid_override_time CHECK (
    (available = false) OR 
    (available = true AND start_time IS NOT NULL AND end_time IS NOT NULL AND end_time > start_time)
  ),
  CONSTRAINT unique_provider_override UNIQUE(provider_id, date, start_time, end_time)
);

-- ================================
-- 2. Core Appointments System
-- ================================

-- Main appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  assignment_id UUID REFERENCES patient_assignments(id), -- links to treatment context
  
  -- Appointment timing
  appointment_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  
  -- Appointment details
  treatment_type TEXT NOT NULL,
  appointment_type TEXT NOT NULL DEFAULT 'consultation' CHECK (
    appointment_type IN ('consultation', 'follow_up', 'treatment', 'evaluation', 'review')
  ),
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (
    status IN ('scheduled', 'confirmed', 'completed', 'cancelled', 'no_show', 'rescheduled')
  ),
  
  -- Notes from different stakeholders
  patient_notes TEXT,
  provider_notes TEXT,
  admin_notes TEXT,
  
  -- Booking metadata
  booked_by TEXT NOT NULL CHECK (booked_by IN ('patient', 'provider', 'admin')),
  booked_by_user_id UUID, -- profile_id of who made the booking
  booking_timestamp TIMESTAMPTZ DEFAULT NOW(),
  
  -- Cancellation/reschedule tracking
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT CHECK (cancelled_by IN ('patient', 'provider', 'admin')),
  cancelled_by_user_id UUID,
  cancellation_reason TEXT,
  
  -- Audit timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Business constraints
  CONSTRAINT valid_appointment_time CHECK (end_time > start_time),
  CONSTRAINT appointment_in_future CHECK (
    appointment_date > CURRENT_DATE OR 
    (appointment_date = CURRENT_DATE AND start_time >= LOCALTIME)
  ),
  CONSTRAINT unique_provider_slot UNIQUE(provider_id, appointment_date, start_time),
  CONSTRAINT valid_cancellation CHECK (
    (status != 'cancelled') OR 
    (status = 'cancelled' AND cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL)
  )
);

-- Appointment history for complete audit trail
CREATE TABLE appointment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN ('created', 'updated', 'cancelled', 'rescheduled', 'completed')),
  performed_by TEXT NOT NULL CHECK (performed_by IN ('patient', 'provider', 'admin', 'system')),
  performed_by_user_id UUID, -- profile_id, can be NULL for system actions
  
  -- Change tracking
  old_values JSONB,
  new_values JSONB,
  reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- 3. Indexes for Performance
-- ================================

-- Provider schedules indexes
CREATE INDEX idx_provider_schedules_provider_id ON provider_schedules(provider_id);
CREATE INDEX idx_provider_schedules_day_active ON provider_schedules(day_of_week, active);

-- Provider overrides indexes  
CREATE INDEX idx_provider_overrides_provider_date ON provider_availability_overrides(provider_id, date);
CREATE INDEX idx_provider_overrides_date_range ON provider_availability_overrides(date);

-- Appointments indexes
CREATE INDEX idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX idx_appointments_provider_id ON appointments(provider_id);
CREATE INDEX idx_appointments_date_range ON appointments(appointment_date);
CREATE INDEX idx_appointments_provider_date ON appointments(provider_id, appointment_date);
CREATE INDEX idx_appointments_status ON appointments(status);
CREATE INDEX idx_appointments_assignment ON appointments(assignment_id);

-- History indexes
CREATE INDEX idx_appointment_history_appointment ON appointment_history(appointment_id);
CREATE INDEX idx_appointment_history_created ON appointment_history(created_at);

-- ================================
-- 4. Triggers for Data Integrity
-- ================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_provider_schedules_updated_at
  BEFORE UPDATE ON provider_schedules
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_appointments_updated_at  
  BEFORE UPDATE ON appointments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Appointment history logging trigger
CREATE OR REPLACE FUNCTION log_appointment_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into appointment_history
  INSERT INTO appointment_history (
    appointment_id,
    action,
    performed_by,
    performed_by_user_id,
    old_values,
    new_values,
    reason
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN 'cancelled'
      WHEN TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN 'completed'  
      WHEN TG_OP = 'UPDATE' AND (NEW.appointment_date != OLD.appointment_date OR NEW.start_time != OLD.start_time) THEN 'rescheduled'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    COALESCE(
      current_setting('app.current_user_role', true),
      'system'
    ),
    CASE 
      WHEN current_setting('app.current_user_id', true) != '' 
      THEN current_setting('app.current_user_id', true)::UUID
      ELSE NULL
    END,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    CASE 
      WHEN TG_OP = 'UPDATE' AND NEW.status = 'cancelled' THEN NEW.cancellation_reason
      ELSE NULL
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER appointment_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION log_appointment_changes();

-- ================================
-- 5. Comments for Documentation
-- ================================

COMMENT ON TABLE provider_schedules IS 'Recurring weekly availability schedules for providers';
COMMENT ON TABLE provider_availability_overrides IS 'Date-specific availability changes (vacations, special hours, etc.)';
COMMENT ON TABLE appointments IS 'Core appointments between patients and providers';
COMMENT ON TABLE appointment_history IS 'Complete audit trail of all appointment changes';

COMMENT ON COLUMN provider_schedules.day_of_week IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN provider_schedules.treatment_types IS 'Empty array means available for all treatment types';
COMMENT ON COLUMN provider_availability_overrides.available IS 'false=unavailable, true=special availability override';
COMMENT ON COLUMN appointments.assignment_id IS 'Links appointment to specific patient-provider treatment assignment';
COMMENT ON COLUMN appointments.booked_by_user_id IS 'Profile ID of the person who booked the appointment';