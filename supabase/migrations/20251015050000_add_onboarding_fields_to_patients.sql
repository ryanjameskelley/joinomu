-- Add onboarding fields directly to patients table for simplicity
ALTER TABLE patients ADD COLUMN IF NOT EXISTS treatment_preferences JSONB; -- Array of selected health areas
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height_feet INTEGER; -- Height in feet
ALTER TABLE patients ADD COLUMN IF NOT EXISTS height_inches INTEGER; -- Height in inches  
ALTER TABLE patients ADD COLUMN IF NOT EXISTS weight_lbs DECIMAL; -- Weight in pounds
ALTER TABLE patients ADD COLUMN IF NOT EXISTS bmi DECIMAL; -- Calculated BMI
ALTER TABLE patients ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ; -- When onboarding was completed

-- Add index for common queries
CREATE INDEX IF NOT EXISTS idx_patients_treatment_preferences ON patients USING GIN (treatment_preferences);
CREATE INDEX IF NOT EXISTS idx_patients_onboarding_completed ON patients (onboarding_completed_at) WHERE onboarding_completed_at IS NOT NULL;