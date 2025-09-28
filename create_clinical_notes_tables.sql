-- SQL to create clinical notes tables
-- Run this directly in Supabase SQL Editor

-- 1. Clinical Notes table
CREATE TABLE IF NOT EXISTS clinical_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  
  -- Clinical Information
  allergies TEXT[] DEFAULT '{}',
  previous_medications TEXT[] DEFAULT '{}',
  current_medications TEXT[] DEFAULT '{}',
  
  -- Clinical Content
  clinical_note TEXT DEFAULT '',
  internal_note TEXT DEFAULT '',
  visit_summary TEXT DEFAULT '',
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  last_updated_by UUID,
  
  -- Ensure one clinical note per appointment
  CONSTRAINT unique_appointment_clinical_note UNIQUE(appointment_id)
);

-- 2. Visit Medication Adjustments table
CREATE TABLE IF NOT EXISTS visit_medication_adjustments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinical_note_id UUID NOT NULL REFERENCES clinical_notes(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  preference_id UUID NOT NULL REFERENCES patient_medication_preferences(id) ON DELETE CASCADE,
  
  -- Previous values
  previous_dosage TEXT,
  previous_frequency TEXT,
  previous_status TEXT,
  previous_provider_notes TEXT,
  
  -- New values
  new_dosage TEXT,
  new_frequency TEXT,
  new_status TEXT CHECK (new_status IN ('pending', 'approved', 'denied', 'discontinued')),
  new_provider_notes TEXT,
  
  -- Adjustment details
  adjustment_reason TEXT,
  provider_notes TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  performed_by UUID NOT NULL
);

-- 3. Visit Interactions table
CREATE TABLE IF NOT EXISTS visit_interactions (
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
  performed_by UUID NOT NULL
);

-- 4. Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_clinical_notes_appointment ON clinical_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_provider ON clinical_notes(provider_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_created_at ON clinical_notes(created_at);

CREATE INDEX IF NOT EXISTS idx_visit_medication_adjustments_clinical_note ON visit_medication_adjustments(clinical_note_id);
CREATE INDEX IF NOT EXISTS idx_visit_medication_adjustments_appointment ON visit_medication_adjustments(appointment_id);
CREATE INDEX IF NOT EXISTS idx_visit_medication_adjustments_preference ON visit_medication_adjustments(preference_id);

CREATE INDEX IF NOT EXISTS idx_visit_interactions_clinical_note ON visit_interactions(clinical_note_id);
CREATE INDEX IF NOT EXISTS idx_visit_interactions_appointment ON visit_interactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_visit_interactions_type ON visit_interactions(interaction_type);

-- 5. Enable RLS
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_medication_adjustments ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_interactions ENABLE ROW LEVEL SECURITY;

-- 6. RLS Policies
-- Providers can manage clinical notes for their patients
CREATE POLICY IF NOT EXISTS "Providers can manage clinical notes for their patients" 
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

-- Patients can view their clinical notes
CREATE POLICY IF NOT EXISTS "Patients can view their clinical notes" 
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

-- Admins can view all clinical notes
CREATE POLICY IF NOT EXISTS "Admins can view all clinical notes" 
ON clinical_notes
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Similar policies for medication adjustments and interactions
CREATE POLICY IF NOT EXISTS "Providers can manage visit medication adjustments" 
ON visit_medication_adjustments
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

CREATE POLICY IF NOT EXISTS "Providers can manage visit interactions" 
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

-- 7. Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS update_clinical_notes_updated_at
  BEFORE UPDATE ON clinical_notes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();