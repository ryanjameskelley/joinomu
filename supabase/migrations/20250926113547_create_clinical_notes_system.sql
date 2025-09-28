-- ================================
-- JoinOmu Clinical Notes System
-- Database Schema for Visit Clinical Notes
-- Integrates with existing medication_preferences table
-- ================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ================================
-- 1. Clinical Notes Table
-- ================================

-- Main clinical notes table that links to appointments
CREATE TABLE clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  
  -- Clinical Information Arrays (stored as JSONB for flexibility and querying)
  allergies TEXT[] DEFAULT '{}',
  previous_medications TEXT[] DEFAULT '{}',
  current_medications TEXT[] DEFAULT '{}',
  
  -- Clinical Content
  clinical_note TEXT DEFAULT '',
  internal_note TEXT DEFAULT '', -- Only visible to providers/staff
  visit_summary TEXT DEFAULT '', -- Auto-generated or custom summary
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- profile_id of creator
  last_updated_by UUID, -- profile_id of last editor
  
  -- Ensure one clinical note per appointment
  CONSTRAINT unique_appointment_clinical_note UNIQUE(appointment_id)
);

-- ================================
-- 2. Medication Adjustments During Visits
-- ================================

-- Track medication adjustments made during clinical visits
-- Links to existing patient_medication_preferences table
CREATE TABLE visit_medication_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_note_id UUID NOT NULL REFERENCES clinical_notes(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  preference_id UUID NOT NULL REFERENCES patient_medication_preferences(id) ON DELETE CASCADE,
  
  -- Previous values (before adjustment)
  previous_dosage TEXT,
  previous_frequency TEXT,
  previous_status TEXT,
  previous_provider_notes TEXT,
  
  -- New values (after adjustment)
  new_dosage TEXT,
  new_frequency TEXT,
  new_status TEXT CHECK (new_status IN ('pending', 'approved', 'denied', 'discontinued')),
  new_provider_notes TEXT,
  
  -- Adjustment details
  adjustment_reason TEXT,
  provider_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID NOT NULL -- profile_id of provider who made the change
);

-- ================================
-- 3. Visit General Interactions
-- ================================

-- Track other types of interactions during visits (non-medication)
CREATE TABLE visit_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_note_id UUID NOT NULL REFERENCES clinical_notes(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  
  -- Type of interaction
  interaction_type TEXT NOT NULL CHECK (
    interaction_type IN ('treatment_plan_update', 'follow_up_scheduled', 'referral_made', 'lab_ordered', 'allergy_noted', 'vital_signs_recorded')
  ),
  
  -- Interaction details
  details TEXT,
  provider_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID NOT NULL -- profile_id of provider who made the change
);

-- ================================
-- 4. Indexes for Performance
-- ================================

-- Clinical notes indexes
CREATE INDEX idx_clinical_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX idx_clinical_notes_provider ON clinical_notes(provider_id);
CREATE INDEX idx_clinical_notes_created_at ON clinical_notes(created_at);
CREATE INDEX idx_clinical_notes_updated_at ON clinical_notes(updated_at);

-- Visit medication adjustments indexes
CREATE INDEX idx_visit_medication_adjustments_clinical_note ON visit_medication_adjustments(clinical_note_id);
CREATE INDEX idx_visit_medication_adjustments_appointment ON visit_medication_adjustments(appointment_id);
CREATE INDEX idx_visit_medication_adjustments_preference ON visit_medication_adjustments(preference_id);
CREATE INDEX idx_visit_medication_adjustments_created_at ON visit_medication_adjustments(created_at);

-- Visit interactions indexes
CREATE INDEX idx_visit_interactions_clinical_note ON visit_interactions(clinical_note_id);
CREATE INDEX idx_visit_interactions_appointment ON visit_interactions(appointment_id);
CREATE INDEX idx_visit_interactions_type ON visit_interactions(interaction_type);
CREATE INDEX idx_visit_interactions_created_at ON visit_interactions(created_at);

-- ================================
-- 4. Triggers for Data Integrity
-- ================================

-- Auto-update updated_at timestamp for clinical notes
CREATE TRIGGER update_clinical_notes_updated_at
  BEFORE UPDATE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update last_updated_by field
CREATE OR REPLACE FUNCTION update_clinical_note_editor()
RETURNS TRIGGER AS $$
BEGIN
  -- Set last_updated_by to current user if available
  IF current_setting('app.current_user_id', true) != '' THEN
    NEW.last_updated_by = current_setting('app.current_user_id', true)::UUID;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_clinical_note_editor_trigger
  BEFORE UPDATE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION update_clinical_note_editor();

-- ================================
-- 5. Row Level Security (RLS)
-- ================================

-- Enable RLS on clinical notes table
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_interactions ENABLE ROW LEVEL SECURITY;

-- Policy for providers: can view/edit clinical notes for their patients
CREATE POLICY "Providers can manage clinical notes for their patients" 
ON clinical_notes
FOR ALL
TO authenticated
USING (
  provider_id IN (
    SELECT p.id FROM providers p 
    JOIN profiles pr ON p.profile_id = pr.id 
    WHERE pr.id = auth.uid()
  )
);

-- Policy for patients: can view their own clinical notes (read-only)
CREATE POLICY "Patients can view their clinical notes" 
ON clinical_notes
FOR SELECT
TO authenticated
USING (
  patient_id IN (
    SELECT p.id FROM patients p 
    JOIN profiles pr ON p.profile_id = pr.id 
    WHERE pr.id = auth.uid()
  )
);

-- Policy for admins: can view all clinical notes
CREATE POLICY "Admins can view all clinical notes" 
ON clinical_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Similar policies for visit_interactions
CREATE POLICY "Providers can manage visit interactions for their patients" 
ON visit_interactions
FOR ALL
TO authenticated
USING (
  appointment_id IN (
    SELECT a.id FROM appointments a 
    JOIN providers p ON a.provider_id = p.id
    JOIN profiles pr ON p.profile_id = pr.id 
    WHERE pr.id = auth.uid()
  )
);

CREATE POLICY "Patients can view their visit interactions" 
ON visit_interactions
FOR SELECT
TO authenticated
USING (
  appointment_id IN (
    SELECT a.id FROM appointments a 
    JOIN patients p ON a.patient_id = p.id
    JOIN profiles pr ON p.profile_id = pr.id 
    WHERE pr.id = auth.uid()
  )
);

CREATE POLICY "Admins can view all visit interactions" 
ON visit_interactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================
-- 6. Comments for Documentation
-- ================================

COMMENT ON TABLE clinical_notes IS 'Clinical notes and medical information recorded during patient visits';
COMMENT ON TABLE visit_medication_adjustments IS 'Medication adjustments made during visits, links to patient_medication_preferences';
COMMENT ON TABLE visit_interactions IS 'General interactions and activities during visits (non-medication)';

COMMENT ON COLUMN clinical_notes.appointment_id IS 'Links clinical note to specific appointment';
COMMENT ON COLUMN clinical_notes.allergies IS 'Array of patient allergies recorded during visit';
COMMENT ON COLUMN clinical_notes.previous_medications IS 'Array of previous medications mentioned during visit';
COMMENT ON COLUMN clinical_notes.current_medications IS 'Array of current medications mentioned during visit';
COMMENT ON COLUMN clinical_notes.clinical_note IS 'Main clinical observations and notes';
COMMENT ON COLUMN clinical_notes.internal_note IS 'Internal provider notes, not visible to patients';
COMMENT ON COLUMN clinical_notes.visit_summary IS 'Auto-generated or custom summary of the visit';

COMMENT ON COLUMN visit_medication_adjustments.preference_id IS 'Links to existing patient_medication_preferences table';
COMMENT ON COLUMN visit_medication_adjustments.adjustment_reason IS 'Reason for the medication adjustment';
COMMENT ON COLUMN visit_interactions.interaction_type IS 'Type of interaction: treatment_plan_update, follow_up_scheduled, etc.';
COMMENT ON COLUMN visit_interactions.details IS 'General details about the interaction';