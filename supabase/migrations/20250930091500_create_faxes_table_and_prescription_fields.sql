-- Create Faxes table and add prescription tracking fields
-- Migration: 20250930091500_create_faxes_table_and_prescription_fields

-- Create Faxes table to track all fax communications
CREATE TABLE public.faxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    approval_id UUID NOT NULL REFERENCES public.medication_approvals(id) ON DELETE CASCADE,
    preference_id UUID NOT NULL REFERENCES public.patient_medication_preferences(id) ON DELETE CASCADE,
    patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES public.providers(id) ON DELETE CASCADE,
    fax_number TEXT NOT NULL,
    fax_content TEXT,
    fax_status TEXT NOT NULL DEFAULT 'sent' CHECK (fax_status IN ('sent', 'delivered', 'failed', 'pending')),
    faxed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    delivery_confirmation_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add faxed timestamp column to patient_medication_preferences
ALTER TABLE public.patient_medication_preferences 
ADD COLUMN faxed TIMESTAMPTZ,
ADD COLUMN next_prescription_due DATE;

-- Create indexes for performance
CREATE INDEX idx_faxes_approval_id ON public.faxes(approval_id);
CREATE INDEX idx_faxes_preference_id ON public.faxes(preference_id);
CREATE INDEX idx_faxes_patient_id ON public.faxes(patient_id);
CREATE INDEX idx_faxes_provider_id ON public.faxes(provider_id);
CREATE INDEX idx_faxes_faxed_at ON public.faxes(faxed_at);
CREATE INDEX idx_faxes_status ON public.faxes(fax_status);

CREATE INDEX idx_patient_medication_preferences_faxed ON public.patient_medication_preferences(faxed);
CREATE INDEX idx_patient_medication_preferences_next_due ON public.patient_medication_preferences(next_prescription_due);

-- Add triggers for updated_at
CREATE TRIGGER update_faxes_updated_at
    BEFORE UPDATE ON public.faxes
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- Add comments for documentation
COMMENT ON TABLE public.faxes IS 'Tracks all fax communications for medication prescriptions';
COMMENT ON COLUMN public.faxes.approval_id IS 'Reference to the medication approval that was faxed';
COMMENT ON COLUMN public.faxes.preference_id IS 'Reference to the patient medication preference';
COMMENT ON COLUMN public.faxes.fax_number IS 'Phone number or fax identifier where prescription was sent';
COMMENT ON COLUMN public.faxes.fax_content IS 'Content or description of what was faxed';
COMMENT ON COLUMN public.faxes.fax_status IS 'Status of the fax transmission';
COMMENT ON COLUMN public.faxes.faxed_at IS 'When the fax was sent';
COMMENT ON COLUMN public.faxes.delivery_confirmation_at IS 'When delivery was confirmed';

COMMENT ON COLUMN public.patient_medication_preferences.faxed IS 'Timestamp when prescription was last faxed to pharmacy';
COMMENT ON COLUMN public.patient_medication_preferences.next_prescription_due IS 'Calculated date when next prescription should be due based on frequency and delivery';

-- Create function to calculate next prescription due date
CREATE OR REPLACE FUNCTION public.calculate_next_prescription_due(
    p_preference_id UUID,
    p_delivery_date DATE,
    p_frequency TEXT
) RETURNS DATE AS $$
DECLARE
    days_to_add INTEGER;
    next_due_date DATE;
BEGIN
    -- Calculate days based on frequency
    CASE p_frequency
        WHEN 'daily' THEN days_to_add := 30; -- 30-day supply
        WHEN 'twice_daily' THEN days_to_add := 30; -- 30-day supply
        WHEN 'weekly' THEN days_to_add := 28; -- 4-week supply
        WHEN 'monthly' THEN days_to_add := 30; -- Monthly supply
        WHEN 'as_needed' THEN days_to_add := 90; -- 90-day supply for PRN
        ELSE days_to_add := 30; -- Default to 30 days
    END CASE;
    
    -- Calculate next due date
    next_due_date := p_delivery_date + INTERVAL '1 day' * days_to_add;
    
    RETURN next_due_date;
END;
$$ LANGUAGE plpgsql;

-- Create function to update next prescription due date when order is delivered
CREATE OR REPLACE FUNCTION public.update_prescription_due_date() RETURNS TRIGGER AS $$
DECLARE
    approval_record RECORD;
    preference_id UUID;
    frequency TEXT;
BEGIN
    -- Only proceed if delivery date was just set (order delivered)
    IF OLD.estimated_delivery_date IS NULL AND NEW.estimated_delivery_date IS NOT NULL THEN
        -- Get the approval and preference info
        SELECT ma.preference_id, ma.frequency 
        INTO preference_id, frequency
        FROM public.medication_approvals ma 
        WHERE ma.id = NEW.approval_id;
        
        IF preference_id IS NOT NULL THEN
            -- Update the next prescription due date
            UPDATE public.patient_medication_preferences 
            SET next_prescription_due = public.calculate_next_prescription_due(
                preference_id, 
                NEW.estimated_delivery_date::DATE, 
                frequency
            )
            WHERE id = preference_id;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on medication_orders to update due dates when delivered
CREATE TRIGGER update_prescription_due_date_trigger
    AFTER UPDATE ON public.medication_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.update_prescription_due_date();

-- Create function to clear faxed status when prescription is due
CREATE OR REPLACE FUNCTION public.clear_overdue_faxed_status() RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    UPDATE public.patient_medication_preferences 
    SET faxed = NULL
    WHERE faxed IS NOT NULL 
    AND next_prescription_due IS NOT NULL 
    AND next_prescription_due <= CURRENT_DATE;
    
    GET DIAGNOSTICS rows_updated = ROW_COUNT;
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION public.calculate_next_prescription_due IS 'Calculates when the next prescription should be due based on delivery date and frequency';
COMMENT ON FUNCTION public.update_prescription_due_date IS 'Trigger function to update next prescription due date when order is delivered';
COMMENT ON FUNCTION public.clear_overdue_faxed_status IS 'Clears faxed status for preferences where prescription is now due';