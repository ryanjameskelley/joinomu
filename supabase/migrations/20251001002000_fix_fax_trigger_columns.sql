-- Fix fax trigger to use correct medication_orders columns
-- Migration: 20251001002000_fix_fax_trigger_columns

-- Update the create_order_on_fax function to use correct column names
CREATE OR REPLACE FUNCTION public.create_order_on_fax() RETURNS TRIGGER AS $$
BEGIN
    -- Only create order when a fax is inserted
    IF TG_OP = 'INSERT' THEN
        -- Insert medication order linked to this approval with correct columns
        INSERT INTO public.medication_orders (
            approval_id,
            medication_id,
            patient_id,
            quantity,
            unit_price,
            total_amount
        )
        SELECT 
            NEW.approval_id,
            pmp.medication_id,
            NEW.patient_id,
            1, -- Default quantity
            COALESCE(m.unit_price, 0.00), -- Get price from medications table
            COALESCE(m.unit_price, 0.00) * 1 -- Total = unit_price * quantity
        FROM public.medication_approvals ma
        JOIN public.patient_medication_preferences pmp ON ma.preference_id = pmp.id
        JOIN public.medications m ON pmp.medication_id = m.id
        WHERE ma.id = NEW.approval_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Add comment for documentation
COMMENT ON FUNCTION public.create_order_on_fax IS 'Creates medication order when prescription is faxed to pharmacy - uses correct medication_orders table columns';