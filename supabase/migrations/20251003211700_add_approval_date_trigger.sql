-- Create trigger to automatically set approval_date when medication status changes to approved

CREATE OR REPLACE FUNCTION update_approval_date_on_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- If status changed to 'approved', set approval_date
    IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
        NEW.approval_date = NOW();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trigger_update_approval_date
    BEFORE UPDATE ON patient_medication_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_approval_date_on_status_change();

-- Add comment
COMMENT ON FUNCTION update_approval_date_on_status_change() IS 'Automatically sets approval_date when medication status changes to approved';