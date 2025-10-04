-- Add date tracking fields for refill requests and approvals
-- This will help determine whether to show "Request Refill" button or "Approved" status

-- Add refill_requested_date to track when patient last requested a refill
ALTER TABLE patient_medication_preferences 
ADD COLUMN refill_requested_date TIMESTAMPTZ;

-- Add approval_date to track when provider last approved a request
ALTER TABLE patient_medication_preferences 
ADD COLUMN approval_date TIMESTAMPTZ;

-- Add comments to document the fields
COMMENT ON COLUMN patient_medication_preferences.refill_requested_date IS 'Timestamp when patient last requested a refill for this medication';
COMMENT ON COLUMN patient_medication_preferences.approval_date IS 'Timestamp when provider last approved this medication/refill';

-- Create indexes for efficient querying
CREATE INDEX idx_patient_medication_preferences_refill_requested_date 
ON patient_medication_preferences(refill_requested_date);

CREATE INDEX idx_patient_medication_preferences_approval_date 
ON patient_medication_preferences(approval_date);

-- Update existing data to set approval_date for currently approved medications
UPDATE patient_medication_preferences 
SET approval_date = updated_at 
WHERE status = 'approved' AND approval_date IS NULL;

-- Set refill_requested_date for medications that currently have refill_requested = TRUE
UPDATE patient_medication_preferences 
SET refill_requested_date = updated_at 
WHERE refill_requested = TRUE AND refill_requested_date IS NULL;