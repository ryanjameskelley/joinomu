-- Fix trigger function to use correct frequency column name
-- Migration: 20251001044500_fix_trigger_frequency_column

-- Update the trigger function to use the correct column name 'approved_frequency' instead of 'frequency'
CREATE OR REPLACE FUNCTION public.update_prescription_due_date() RETURNS TRIGGER AS $$
DECLARE
    approval_record RECORD;
    preference_id UUID;
    frequency TEXT;
BEGIN
    -- Only proceed if delivery date was just set (order delivered)
    IF OLD.estimated_delivery IS NULL AND NEW.estimated_delivery IS NOT NULL THEN
        -- Get the approval and preference info
        SELECT ma.preference_id, ma.approved_frequency
        INTO preference_id, frequency
        FROM public.medication_approvals ma
        WHERE ma.id = NEW.approval_id;

        IF preference_id IS NOT NULL THEN
            -- Update the next prescription due date
            UPDATE public.patient_medication_preferences
            SET next_prescription_due = public.calculate_next_prescription_due(
                preference_id,
                NEW.estimated_delivery::DATE,
                frequency
            )
            WHERE id = preference_id;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.update_prescription_due_date() TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.update_prescription_due_date IS 'Updates prescription due date when medication order delivery date is set (uses approved_frequency column)';