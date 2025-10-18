-- Restore missing onboarding columns to patients table
-- These columns are needed for the patient onboarding flow

-- Basic onboarding info
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS treatment_preferences TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS weight_loss_goals TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medication_preference TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS transition_answer TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS selected_state TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gender TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS motivations TEXT[];

-- Extended health assessment fields
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS height_feet TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS height_inches TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS weight TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS activity_level TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS eating_disorders TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS mental_health TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS self_harm_screening TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS diagnosed_conditions TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS chronic_diseases TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS family_medical_history TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS family_health TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medication_history TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS procedures TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS supplements TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allergies TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS drinking TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS drugs TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS smoking TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS heart_rate TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gastrointestinal TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS side_effects TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS side_effect_guidance TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS challenges TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS challenges_elaborate TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS program_adherence TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS program_consistency TEXT[];
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS gastrointestinal_dosing TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS energy_dosing TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS muscle_loss_dosing TEXT;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS additional_info TEXT;

-- Calculated fields
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS bmi DECIMAL(4,1);
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS medication_qualified BOOLEAN DEFAULT false;

-- Flow tracking
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS current_onboarding_step TEXT DEFAULT 'path';

-- Also add the JSONB variant for compatibility
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS treatment_preferences_jsonb JSONB;
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS weight_lbs DECIMAL;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_patients_treatment_preferences ON patients USING GIN (treatment_preferences_jsonb);
CREATE INDEX IF NOT EXISTS idx_patients_onboarding_completed ON patients (onboarding_completed_at) WHERE onboarding_completed_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_patients_selected_state ON patients (selected_state);
CREATE INDEX IF NOT EXISTS idx_patients_gender ON patients (gender);

-- Add comments for documentation
COMMENT ON COLUMN public.patients.treatment_preferences IS 'Selected treatment areas from path entry (weight-loss, etc)';
COMMENT ON COLUMN public.patients.weight_loss_goals IS 'Weight loss goal selection (1-15, 16-50, 51+, not-sure)';
COMMENT ON COLUMN public.patients.medication_preference IS 'Medication preference (yes-specific, no, etc)';
COMMENT ON COLUMN public.patients.selected_state IS 'State selection for provider assignment and eligibility';
COMMENT ON COLUMN public.patients.gender IS 'Gender selection for personalized treatment';
COMMENT ON COLUMN public.patients.bmi IS 'Calculated BMI from height and weight';
COMMENT ON COLUMN public.patients.medication_qualified IS 'Whether patient qualifies for medication based on BMI and health assessment';
COMMENT ON COLUMN public.patients.current_onboarding_step IS 'Current step in onboarding flow for resuming incomplete flows';