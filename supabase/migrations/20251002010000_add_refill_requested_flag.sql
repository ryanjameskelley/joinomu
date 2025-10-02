-- Add refill_requested flag to patient_medication_preferences
-- This prevents admin-triggered pending preferences from appearing in provider approvals
-- until patient explicitly requests a refill

-- Add the refill_requested column
ALTER TABLE patient_medication_preferences 
ADD COLUMN refill_requested BOOLEAN DEFAULT FALSE;

-- Add index for efficient querying
CREATE INDEX idx_patient_medication_preferences_refill_requested 
ON patient_medication_preferences(refill_requested);

-- Add comment to document the field
COMMENT ON COLUMN patient_medication_preferences.refill_requested IS 'TRUE when patient has explicitly requested a refill, FALSE when preference was set to pending by admin/system';

-- Set existing pending preferences to have refill_requested = TRUE
-- (assuming any current pending preferences were patient-requested)
UPDATE patient_medication_preferences 
SET refill_requested = TRUE 
WHERE status = 'pending';

-- Add compound index for provider approval queries
CREATE INDEX idx_preferences_provider_approval 
ON patient_medication_preferences(status, refill_requested) 
WHERE status = 'pending' AND refill_requested = TRUE;