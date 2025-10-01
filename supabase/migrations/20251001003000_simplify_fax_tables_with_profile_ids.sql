-- Simplify fax workflow by using profile IDs directly
-- Migration: 20251001003000_simplify_fax_tables_with_profile_ids

-- 1. Add new profile_id columns to medication_approvals
ALTER TABLE public.medication_approvals 
ADD COLUMN provider_profile_id UUID REFERENCES auth.users(id);

-- 2. Add new profile_id columns to faxes
ALTER TABLE public.faxes
ADD COLUMN provider_profile_id UUID REFERENCES auth.users(id),
ADD COLUMN patient_profile_id UUID REFERENCES auth.users(id);

-- 3. Add new profile_id columns to medication_orders  
ALTER TABLE public.medication_orders
ADD COLUMN provider_profile_id UUID REFERENCES auth.users(id),
ADD COLUMN patient_profile_id UUID REFERENCES auth.users(id);

-- 4. Update existing data to populate profile_id columns
-- For medication_approvals
UPDATE public.medication_approvals 
SET provider_profile_id = (
    SELECT p.profile_id 
    FROM public.providers p 
    WHERE p.id = medication_approvals.provider_id
);

-- For faxes
UPDATE public.faxes 
SET provider_profile_id = (
    SELECT p.profile_id 
    FROM public.providers p 
    WHERE p.id = faxes.provider_id
),
patient_profile_id = (
    SELECT pt.profile_id 
    FROM public.patients pt 
    WHERE pt.id = faxes.patient_id
);

-- For medication_orders
UPDATE public.medication_orders 
SET provider_profile_id = (
    SELECT p.profile_id 
    FROM public.providers p 
    JOIN public.medication_approvals ma ON ma.provider_id = p.id
    WHERE ma.id = medication_orders.approval_id
),
patient_profile_id = (
    SELECT pt.profile_id 
    FROM public.patients pt 
    WHERE pt.id = medication_orders.patient_id
);

-- 5. Make the new columns NOT NULL after data migration
ALTER TABLE public.medication_approvals 
ALTER COLUMN provider_profile_id SET NOT NULL;

ALTER TABLE public.faxes
ALTER COLUMN provider_profile_id SET NOT NULL,
ALTER COLUMN patient_profile_id SET NOT NULL;

ALTER TABLE public.medication_orders
ALTER COLUMN provider_profile_id SET NOT NULL,
ALTER COLUMN patient_profile_id SET NOT NULL;

-- 6. Update the fax trigger to use profile IDs directly
CREATE OR REPLACE FUNCTION public.create_order_on_fax() RETURNS TRIGGER AS $$
BEGIN
    -- Only create order when a fax is inserted
    IF TG_OP = 'INSERT' THEN
        -- Insert medication order using profile IDs directly
        INSERT INTO public.medication_orders (
            approval_id,
            medication_id,
            patient_id,
            provider_profile_id,
            patient_profile_id,
            quantity,
            unit_price,
            total_amount
        )
        SELECT 
            NEW.approval_id,
            pmp.medication_id,
            (SELECT pt.id FROM public.patients pt WHERE pt.profile_id = NEW.patient_profile_id LIMIT 1),
            NEW.provider_profile_id,
            NEW.patient_profile_id,
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

-- 7. Add indexes for the new profile_id columns
CREATE INDEX idx_medication_approvals_provider_profile_id ON public.medication_approvals(provider_profile_id);
CREATE INDEX idx_faxes_provider_profile_id ON public.faxes(provider_profile_id);
CREATE INDEX idx_faxes_patient_profile_id ON public.faxes(patient_profile_id);
CREATE INDEX idx_medication_orders_provider_profile_id ON public.medication_orders(provider_profile_id);
CREATE INDEX idx_medication_orders_patient_profile_id ON public.medication_orders(patient_profile_id);

-- 8. Add comments for documentation
COMMENT ON COLUMN public.medication_approvals.provider_profile_id IS 'Direct reference to provider auth user ID';
COMMENT ON COLUMN public.faxes.provider_profile_id IS 'Direct reference to provider auth user ID';
COMMENT ON COLUMN public.faxes.patient_profile_id IS 'Direct reference to patient auth user ID';
COMMENT ON COLUMN public.medication_orders.provider_profile_id IS 'Direct reference to provider auth user ID';
COMMENT ON COLUMN public.medication_orders.patient_profile_id IS 'Direct reference to patient auth user ID';

COMMENT ON FUNCTION public.create_order_on_fax IS 'Creates medication order when prescription is faxed - uses profile IDs directly for simplicity';