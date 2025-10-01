-- Fix renewal system to update patient preferences instead of approvals
-- Migration: 20251001052000_fix_renewal_to_update_preferences

-- Update the reset_expired_approvals function to reset patient preferences to pending
CREATE OR REPLACE FUNCTION public.reset_expired_approvals() RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    -- Reset patient preferences to pending when supply period has elapsed
    -- This way they show up in the provider dashboard as new approval requests
    UPDATE public.patient_medication_preferences
    SET
        status = 'pending',
        updated_at = NOW()
    FROM public.medication_approvals ma
    JOIN public.medication_orders mo ON ma.id = mo.approval_id
    WHERE patient_medication_preferences.id = ma.preference_id
    AND ma.status = 'approved'
    AND ma.supply_days IS NOT NULL
    AND mo.estimated_delivery IS NOT NULL
    AND mo.fulfillment_status = 'delivered'
    AND (mo.estimated_delivery::DATE + INTERVAL '1 day' * ma.supply_days) <= CURRENT_DATE;

    GET DIAGNOSTICS rows_updated = ROW_COUNT;

    -- Log the action for debugging
    INSERT INTO public.auth_trigger_logs (trigger_stage, success, error_message, metadata, created_at)
    VALUES (
        'APPROVAL_RESET',
        true,
        format('Reset %s expired preferences to pending status', rows_updated),
        jsonb_build_object('reset_count', rows_updated, 'reset_date', CURRENT_DATE),
        NOW()
    );

    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the check_approval_expiry_on_delivery function to reset preferences as well
CREATE OR REPLACE FUNCTION public.check_approval_expiry_on_delivery() RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if fulfillment status changed to 'delivered' and estimated_delivery is set
    IF OLD.fulfillment_status != 'delivered' AND NEW.fulfillment_status = 'delivered' AND NEW.estimated_delivery IS NOT NULL THEN
        -- Check if this specific preference should be reset due to expiry
        UPDATE public.patient_medication_preferences 
        SET 
            status = 'pending',
            updated_at = NOW()
        FROM public.medication_approvals ma
        WHERE patient_medication_preferences.id = ma.preference_id
        AND ma.id = NEW.approval_id
        AND ma.status = 'approved'
        AND ma.supply_days IS NOT NULL
        AND (NEW.estimated_delivery::DATE + INTERVAL '1 day' * ma.supply_days) <= CURRENT_DATE;
        
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
COMMENT ON FUNCTION public.reset_expired_approvals IS 'Reset expired patient preferences to pending status so they appear in provider dashboard';
COMMENT ON FUNCTION public.check_approval_expiry_on_delivery IS 'Check preference expiry when orders are delivered and reset to pending status';