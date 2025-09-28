-- Final clinical notes fix without admin policies

-- Drop existing trigger if it exists to avoid conflicts
DROP TRIGGER IF EXISTS update_clinical_notes_updated_at ON clinical_notes;

-- Ensure the trigger function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_clinical_notes_updated_at
    BEFORE UPDATE ON clinical_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Ensure all required columns exist in clinical_notes
DO $$ 
BEGIN
    -- Check and add appointment_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'appointment_id') THEN
        ALTER TABLE clinical_notes ADD COLUMN appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;
    END IF;
    
    -- Check and add patient_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'patient_id') THEN
        ALTER TABLE clinical_notes ADD COLUMN patient_id UUID REFERENCES patients(id) ON DELETE CASCADE;
    END IF;
    
    -- Check and add provider_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'provider_id') THEN
        ALTER TABLE clinical_notes ADD COLUMN provider_id UUID REFERENCES providers(id) ON DELETE CASCADE;
    END IF;
    
    -- Check and add other columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'allergies') THEN
        ALTER TABLE clinical_notes ADD COLUMN allergies TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'previous_medications') THEN
        ALTER TABLE clinical_notes ADD COLUMN previous_medications TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'current_medications') THEN
        ALTER TABLE clinical_notes ADD COLUMN current_medications TEXT[] DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'clinical_note') THEN
        ALTER TABLE clinical_notes ADD COLUMN clinical_note TEXT DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'internal_note') THEN
        ALTER TABLE clinical_notes ADD COLUMN internal_note TEXT DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'visit_summary') THEN
        ALTER TABLE clinical_notes ADD COLUMN visit_summary TEXT DEFAULT '';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'created_by') THEN
        ALTER TABLE clinical_notes ADD COLUMN created_by UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'clinical_notes' AND column_name = 'last_updated_by') THEN
        ALTER TABLE clinical_notes ADD COLUMN last_updated_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Ensure all required columns exist in visit_interactions
DO $$ 
BEGIN
    -- Check and add clinical_note_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'clinical_note_id') THEN
        ALTER TABLE visit_interactions ADD COLUMN clinical_note_id UUID REFERENCES clinical_notes(id) ON DELETE CASCADE;
    END IF;
    
    -- Check and add appointment_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'appointment_id') THEN
        ALTER TABLE visit_interactions ADD COLUMN appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE;
    END IF;
    
    -- Check and add interaction_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'interaction_type') THEN
        ALTER TABLE visit_interactions ADD COLUMN interaction_type TEXT NOT NULL DEFAULT 'medication_adjustment' CHECK (
            interaction_type IN ('medication_adjustment', 'treatment_plan_update', 'follow_up_scheduled', 'referral_made', 'lab_ordered')
        );
    END IF;
    
    -- Check and add medication columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'medication_id') THEN
        ALTER TABLE visit_interactions ADD COLUMN medication_id UUID;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'medication_name') THEN
        ALTER TABLE visit_interactions ADD COLUMN medication_name TEXT;
    END IF;
    
    -- Check and add dosage columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'previous_dosage') THEN
        ALTER TABLE visit_interactions ADD COLUMN previous_dosage TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'new_dosage') THEN
        ALTER TABLE visit_interactions ADD COLUMN new_dosage TEXT;
    END IF;
    
    -- Check and add frequency columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'previous_frequency') THEN
        ALTER TABLE visit_interactions ADD COLUMN previous_frequency TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'new_frequency') THEN
        ALTER TABLE visit_interactions ADD COLUMN new_frequency TEXT;
    END IF;
    
    -- Check and add status columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'previous_status') THEN
        ALTER TABLE visit_interactions ADD COLUMN previous_status TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'new_status') THEN
        ALTER TABLE visit_interactions ADD COLUMN new_status TEXT CHECK (
            new_status IS NULL OR new_status IN ('pending', 'approved', 'denied', 'discontinued')
        );
    END IF;
    
    -- Check and add other columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'details') THEN
        ALTER TABLE visit_interactions ADD COLUMN details TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'provider_notes') THEN
        ALTER TABLE visit_interactions ADD COLUMN provider_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'visit_interactions' AND column_name = 'performed_by') THEN
        ALTER TABLE visit_interactions ADD COLUMN performed_by UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- Create missing indexes
CREATE INDEX IF NOT EXISTS idx_clinical_notes_appointment_id ON clinical_notes(appointment_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_patient_id ON clinical_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_clinical_notes_provider_id ON clinical_notes(provider_id);
CREATE INDEX IF NOT EXISTS idx_visit_interactions_clinical_note_id ON visit_interactions(clinical_note_id);
CREATE INDEX IF NOT EXISTS idx_visit_interactions_appointment_id ON visit_interactions(appointment_id);
CREATE INDEX IF NOT EXISTS idx_visit_interactions_medication_id ON visit_interactions(medication_id);

-- Add unique constraint to clinical_notes if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'unique_clinical_note_per_appointment'
    ) THEN
        ALTER TABLE clinical_notes ADD CONSTRAINT unique_clinical_note_per_appointment UNIQUE(appointment_id);
    END IF;
END $$;

-- Ensure RLS policies exist (these should be idempotent)
ALTER TABLE clinical_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE visit_interactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and recreate them to ensure they're correct
DROP POLICY IF EXISTS "Providers can view their own clinical notes" ON clinical_notes;
DROP POLICY IF EXISTS "Providers can create clinical notes for their patients" ON clinical_notes;
DROP POLICY IF EXISTS "Providers can update their own clinical notes" ON clinical_notes;
DROP POLICY IF EXISTS "Patients can view their own clinical notes" ON clinical_notes;

DROP POLICY IF EXISTS "Providers can view their own visit interactions" ON visit_interactions;
DROP POLICY IF EXISTS "Providers can create visit interactions for their appointments" ON visit_interactions;
DROP POLICY IF EXISTS "Patients can view their own visit interactions" ON visit_interactions;

-- Recreate clinical notes policies
CREATE POLICY "Providers can view their own clinical notes" ON clinical_notes
    FOR SELECT USING (
        provider_id IN (
            SELECT p.id FROM providers p WHERE p.profile_id = auth.uid()
        )
    );

CREATE POLICY "Providers can create clinical notes for their patients" ON clinical_notes
    FOR INSERT WITH CHECK (
        provider_id IN (
            SELECT p.id FROM providers p WHERE p.profile_id = auth.uid()
        )
    );

CREATE POLICY "Providers can update their own clinical notes" ON clinical_notes
    FOR UPDATE USING (
        provider_id IN (
            SELECT p.id FROM providers p WHERE p.profile_id = auth.uid()
        )
    );

CREATE POLICY "Patients can view their own clinical notes" ON clinical_notes
    FOR SELECT USING (
        patient_id IN (
            SELECT p.id FROM patients p WHERE p.profile_id = auth.uid()
        )
    );

-- Recreate visit interactions policies
CREATE POLICY "Providers can view their own visit interactions" ON visit_interactions
    FOR SELECT USING (
        appointment_id IN (
            SELECT a.id FROM appointments a
            JOIN providers p ON a.provider_id = p.id
            WHERE p.profile_id = auth.uid()
        )
    );

CREATE POLICY "Providers can create visit interactions for their appointments" ON visit_interactions
    FOR INSERT WITH CHECK (
        appointment_id IN (
            SELECT a.id FROM appointments a
            JOIN providers p ON a.provider_id = p.id
            WHERE p.profile_id = auth.uid()
        )
    );

CREATE POLICY "Patients can view their own visit interactions" ON visit_interactions
    FOR SELECT USING (
        appointment_id IN (
            SELECT a.id FROM appointments a
            JOIN patients p ON a.patient_id = p.id
            WHERE p.profile_id = auth.uid()
        )
    );