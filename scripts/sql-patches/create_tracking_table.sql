-- Create medication tracking entries table manually
CREATE TABLE IF NOT EXISTS medication_tracking_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_preference_id UUID NOT NULL REFERENCES patient_medication_preferences(id) ON DELETE CASCADE,
  taken_date DATE NOT NULL,
  taken_time TIME,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure one entry per medication per day
  UNIQUE(patient_id, medication_preference_id, taken_date)
);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_medication_tracking_patient_id ON medication_tracking_entries(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_tracking_preference_id ON medication_tracking_entries(medication_preference_id);
CREATE INDEX IF NOT EXISTS idx_medication_tracking_taken_date ON medication_tracking_entries(taken_date);

-- Enable RLS (Row Level Security)
ALTER TABLE medication_tracking_entries ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own tracking entries" ON medication_tracking_entries;
DROP POLICY IF EXISTS "Users can insert their own tracking entries" ON medication_tracking_entries;
DROP POLICY IF EXISTS "Users can update their own tracking entries" ON medication_tracking_entries;
DROP POLICY IF EXISTS "Users can delete their own tracking entries" ON medication_tracking_entries;
DROP POLICY IF EXISTS "Providers can view assigned patient tracking entries" ON medication_tracking_entries;
-- DROP POLICY IF EXISTS "Admins can view all tracking entries" ON medication_tracking_entries;

-- Create RLS policies
-- Patients can only see/modify their own tracking entries
CREATE POLICY "Users can view their own tracking entries" ON medication_tracking_entries
  FOR SELECT USING (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own tracking entries" ON medication_tracking_entries
  FOR INSERT WITH CHECK (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own tracking entries" ON medication_tracking_entries
  FOR UPDATE USING (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete their own tracking entries" ON medication_tracking_entries
  FOR DELETE USING (
    patient_id IN (
      SELECT id FROM patients WHERE profile_id = auth.uid()
    )
  );

-- Providers can view tracking entries for their assigned patients
CREATE POLICY "Providers can view assigned patient tracking entries" ON medication_tracking_entries
  FOR SELECT USING (
    patient_id IN (
      SELECT pa.patient_id 
      FROM patient_assignments pa
      JOIN providers p ON pa.provider_id = p.id
      WHERE p.profile_id = auth.uid() AND pa.active = true
    )
  );

-- Admins can view all tracking entries (commented out - admin_users table doesn't exist)
-- CREATE POLICY "Admins can view all tracking entries" ON medication_tracking_entries
--   FOR ALL USING (
--     EXISTS (
--       SELECT 1 FROM admin_users WHERE profile_id = auth.uid()
--     )
--   );