-- Fix daily_approval_reset_check function to use correct column names
-- Migration: 20251001060000_fix_daily_check_column_names

-- Update the daily_approval_reset_check function to use trigger_stage and success instead of step and status
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

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.daily_approval_reset_check() TO anon, authenticated;

-- Add comment
COMMENT ON FUNCTION public.daily_approval_reset_check IS 'Daily check for expired approvals with duplicate run prevention (fixed to use trigger_stage and success columns)';