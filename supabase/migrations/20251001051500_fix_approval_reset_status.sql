-- Fix approval reset status to use valid constraint value
-- Migration: 20251001051500_fix_approval_reset_status

-- Update the reset_expired_approvals function to use 'needs_review' instead of 'pending'
CREATE OR REPLACE FUNCTION public.reset_expired_approvals() RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    -- Reset approvals to needs_review when supply period has elapsed
    -- Using 'needs_review' instead of 'pending' to match the check constraint
    UPDATE public.medication_approvals
    SET
        status = 'needs_review',
        updated_at = NOW()
    FROM public.medication_orders mo
    WHERE medication_approvals.id = mo.approval_id
    AND medication_approvals.status = 'approved'
    AND medication_approvals.supply_days IS NOT NULL
    AND mo.estimated_delivery IS NOT NULL
    AND mo.fulfillment_status = 'delivered'
    AND (mo.estimated_delivery::DATE + INTERVAL '1 day' * medication_approvals.supply_days) <= CURRENT_DATE;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    -- Log the action for debugging using correct column names
    INSERT INTO public.auth_trigger_logs (trigger_stage, success, error_message, metadata, created_at)
    VALUES (
        'APPROVAL_RESET',
        true,
        format('Reset %s expired approvals to needs_review status', rows_updated),
        jsonb_build_object('reset_count', rows_updated, 'reset_date', CURRENT_DATE),
        NOW()
    );

    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the check_approval_expiry_on_delivery function to use 'needs_review' as well
CREATE OR REPLACE FUNCTION public.check_approval_expiry_on_delivery() RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if fulfillment status changed to 'delivered' and estimated_delivery is set
    IF OLD.fulfillment_status != 'delivered' AND NEW.fulfillment_status = 'delivered' AND NEW.estimated_delivery IS NOT NULL THEN
        -- Check if this specific approval should be reset due to expiry
        UPDATE public.medication_approvals 
        SET 
            status = 'needs_review',
            updated_at = NOW()
        WHERE id = NEW.approval_id
        AND status = 'approved'
        AND supply_days IS NOT NULL
        AND (NEW.estimated_delivery::DATE + INTERVAL '1 day' * supply_days) <= CURRENT_DATE;
        
        -- Also run the general daily check (but it will skip if already run today)
        PERFORM public.daily_approval_reset_check();
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.reset_expired_approvals() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.check_approval_expiry_on_delivery() TO anon, authenticated;

-- Add comments
COMMENT ON FUNCTION public.reset_expired_approvals IS 'Reset expired approvals to needs_review status (fixed to use valid constraint value)';
COMMENT ON FUNCTION public.check_approval_expiry_on_delivery IS 'Check approval expiry when orders are delivered (fixed to use needs_review status)';