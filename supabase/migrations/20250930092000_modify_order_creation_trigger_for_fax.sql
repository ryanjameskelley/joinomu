-- Modify order creation trigger to activate on fax instead of approval
-- Migration: 20250930092000_modify_order_creation_trigger_for_fax

-- Create function to create medication order when fax is sent
CREATE OR REPLACE FUNCTION public.create_order_on_fax() RETURNS TRIGGER AS $$
BEGIN
    -- Only create order when a fax is inserted
    IF TG_OP = 'INSERT' THEN
        -- Insert medication order linked to this approval
        INSERT INTO public.medication_orders (
            approval_id,
            medication_id,
            patient_id,
            dosage,
            frequency,
            quantity,
            fulfillment_status,
            payment_status,
            created_at
        )
        SELECT 
            NEW.approval_id,
            pmp.medication_id,
            NEW.patient_id,
            pmp.preferred_dosage,
            ma.frequency,
            '30', -- Default 30-day supply
            'pending',
            'pending',
            NOW()
        FROM public.medication_approvals ma
        JOIN public.patient_medication_preferences pmp ON ma.preference_id = pmp.id
        WHERE ma.id = NEW.approval_id;
        
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on faxes table to create orders when fax is sent
DROP TRIGGER IF EXISTS create_order_on_fax_trigger ON public.faxes;
CREATE TRIGGER create_order_on_fax_trigger
    AFTER INSERT ON public.faxes
    FOR EACH ROW
    EXECUTE FUNCTION public.create_order_on_fax();

-- Remove old trigger that created orders on approval (if it exists)
DROP TRIGGER IF EXISTS create_order_on_approval_trigger ON public.medication_approvals;
DROP FUNCTION IF EXISTS public.create_order_on_approval();

COMMENT ON FUNCTION public.create_order_on_fax IS 'Creates medication order when prescription is faxed to pharmacy';
COMMENT ON TRIGGER create_order_on_fax_trigger ON public.faxes IS 'Trigger to create medication order when fax is sent';