-- Add allergies column to patients table for Account Dialog integration
-- This allows patients to store allergy information in their health profile

ALTER TABLE patients ADD COLUMN allergies TEXT;

-- Add comment for documentation
COMMENT ON COLUMN patients.allergies IS 'Patient allergy information stored as text';