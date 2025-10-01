-- Fix daily maintenance function to use correct column names
-- Migration: 20251001050500_fix_daily_maintenance_function

-- Update the daily_approval_reset_check function to use correct column names
CREATE OR REPLACE FUNCTION public.daily_approval_reset_check() RETURNS INTEGER AS $$
DECLARE
    last_run_date DATE;
    rows_reset INTEGER;
BEGIN
    -- Check when this was last run using correct column names
    SELECT (metadata->>'reset_date')::DATE 
    INTO last_run_date
    FROM public.auth_trigger_logs 
    WHERE trigger_stage = 'APPROVAL_RESET' 
    AND success = true
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Only run if we haven't run today
    IF last_run_date IS NULL OR last_run_date < CURRENT_DATE THEN
        rows_reset := public.reset_expired_approvals();
        RETURN rows_reset;
    ELSE
        -- Log that we skipped because already ran today
        INSERT INTO public.auth_trigger_logs (trigger_stage, success, error_message, metadata, created_at)
        VALUES (
            'APPROVAL_RESET_SKIPPED', 
            true, 
            'Skipped approval reset - already ran today',
            jsonb_build_object('last_run_date', last_run_date, 'current_date', CURRENT_DATE),
            NOW()
        );
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the reset_expired_approvals function to use correct column names for logging
CREATE OR REPLACE FUNCTION public.reset_expired_approvals() RETURNS INTEGER AS $$
DECLARE
    rows_updated INTEGER;
BEGIN
    -- Reset approvals to pending when supply period has elapsed
    UPDATE public.medication_approvals
    SET
        status = 'pending',
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
        format('Reset %s expired approvals to pending status', rows_updated),
        jsonb_build_object('reset_count', rows_updated, 'reset_date', CURRENT_DATE),
        NOW()
    );

    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.daily_approval_reset_check() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.reset_expired_approvals() TO anon, authenticated;

-- Add comments
COMMENT ON FUNCTION public.daily_approval_reset_check IS 'Daily check for expired approvals with duplicate run prevention (fixed column names)';
COMMENT ON FUNCTION public.reset_expired_approvals IS 'Reset expired approvals to pending status (fixed column names for logging)';