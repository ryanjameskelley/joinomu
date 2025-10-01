-- Schedule automatic approval resets
-- Migration: 20251001051000_schedule_approval_resets

-- Enable pg_cron extension for scheduled jobs (if available)
-- Note: This may not work in all Supabase environments
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Alternative: Create a function that can be called periodically
-- This function includes logic to prevent multiple runs in the same day
CREATE OR REPLACE FUNCTION public.daily_approval_reset_check() RETURNS INTEGER AS $$
DECLARE
    last_run_date DATE;
    rows_reset INTEGER;
BEGIN
    -- Check when this was last run
    SELECT (metadata->>'reset_date')::DATE 
    INTO last_run_date
    FROM public.auth_trigger_logs 
    WHERE step = 'APPROVAL_RESET' 
    AND status = 'SUCCESS'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    -- Only run if we haven't run today
    IF last_run_date IS NULL OR last_run_date < CURRENT_DATE THEN
        rows_reset := public.reset_expired_approvals();
        RETURN rows_reset;
    ELSE
        -- Log that we skipped because already ran today
        INSERT INTO public.auth_trigger_logs (step, status, message, metadata, created_at)
        VALUES (
            'APPROVAL_RESET_SKIPPED', 
            'SUCCESS', 
            'Skipped approval reset - already ran today',
            jsonb_build_object('last_run_date', last_run_date, 'current_date', CURRENT_DATE),
            NOW()
        );
        RETURN 0;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a trigger that runs the reset when medication orders are updated to 'delivered'
-- This provides near real-time expiry checking when orders are delivered
CREATE OR REPLACE FUNCTION public.check_approval_expiry_on_delivery() RETURNS TRIGGER AS $$
BEGIN
    -- Only proceed if fulfillment status changed to 'delivered' and estimated_delivery is set
    IF OLD.fulfillment_status != 'delivered' AND NEW.fulfillment_status = 'delivered' AND NEW.estimated_delivery IS NOT NULL THEN
        -- Check if this specific approval should be reset due to expiry
        UPDATE public.medication_approvals 
        SET 
            status = 'pending',
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

-- Create the trigger
CREATE TRIGGER check_approval_expiry_on_delivery_trigger
    AFTER UPDATE ON public.medication_orders
    FOR EACH ROW
    EXECUTE FUNCTION public.check_approval_expiry_on_delivery();

-- Create a function that can be called from the application to trigger daily checks
CREATE OR REPLACE FUNCTION public.run_daily_maintenance() RETURNS JSONB AS $$
DECLARE
    reset_count INTEGER;
    expired_count INTEGER;
    result JSONB;
BEGIN
    -- Run the daily approval reset check
    reset_count := public.daily_approval_reset_check();
    
    -- Get count of approvals that are currently expired but not yet reset
    SELECT COUNT(*)::INTEGER INTO expired_count
    FROM public.approval_renewal_status
    WHERE renewal_status = 'EXPIRED' AND status = 'approved';
    
    -- Return summary
    result := jsonb_build_object(
        'approvals_reset', reset_count,
        'approvals_still_expired', expired_count,
        'run_date', CURRENT_DATE,
        'run_time', NOW()
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comments
COMMENT ON FUNCTION public.daily_approval_reset_check IS 'Daily check for expired approvals with duplicate run prevention';
COMMENT ON FUNCTION public.check_approval_expiry_on_delivery IS 'Trigger function to check approval expiry when orders are delivered';
COMMENT ON FUNCTION public.run_daily_maintenance IS 'Main maintenance function to be called daily from application or cron';

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.daily_approval_reset_check() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.run_daily_maintenance() TO anon, authenticated;