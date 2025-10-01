-- Auto-reset expired medication approvals for renewal
-- Migration: 20251001050000_auto_reset_expired_approvals

-- Function to reset approvals that have expired based on supply days
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
    
    -- Log the action for debugging
    INSERT INTO public.auth_trigger_logs (step, status, message, metadata, created_at)
    VALUES (
        'APPROVAL_RESET', 
        'SUCCESS', 
        format('Reset %s expired approvals to pending status', rows_updated),
        jsonb_build_object('reset_count', rows_updated, 'reset_date', CURRENT_DATE),
        NOW()
    );
    
    RETURN rows_updated;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check which approvals are due for renewal (for monitoring)
CREATE OR REPLACE FUNCTION public.get_approvals_due_for_renewal() 
RETURNS TABLE(
    approval_id UUID,
    patient_name TEXT,
    medication_name TEXT,
    supply_days INTEGER,
    estimated_delivery DATE,
    days_since_delivery INTEGER,
    expires_on DATE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ma.id as approval_id,
        (p.first_name || ' ' || p.last_name) as patient_name,
        m.name as medication_name,
        ma.supply_days,
        mo.estimated_delivery::DATE as estimated_delivery,
        (CURRENT_DATE - mo.estimated_delivery::DATE) as days_since_delivery,
        (mo.estimated_delivery::DATE + INTERVAL '1 day' * ma.supply_days)::DATE as expires_on
    FROM public.medication_approvals ma
    JOIN public.medication_orders mo ON ma.id = mo.approval_id
    JOIN public.patient_medication_preferences pmp ON ma.preference_id = pmp.id
    JOIN public.medications m ON pmp.medication_id = m.id
    JOIN public.patients pt ON pmp.patient_id = pt.id
    JOIN public.profiles p ON pt.profile_id = p.id
    WHERE ma.status = 'approved'
    AND ma.supply_days IS NOT NULL
    AND mo.estimated_delivery IS NOT NULL
    AND mo.fulfillment_status = 'delivered'
    AND (mo.estimated_delivery::DATE + INTERVAL '1 day' * ma.supply_days) <= CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to manually trigger approval resets (for testing)
CREATE OR REPLACE FUNCTION public.trigger_approval_reset() RETURNS INTEGER AS $$
BEGIN
    RETURN public.reset_expired_approvals();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a view for easy monitoring of approval renewal status
CREATE OR REPLACE VIEW public.approval_renewal_status AS
SELECT 
    ma.id as approval_id,
    ma.status,
    ma.supply_days,
    (p.first_name || ' ' || p.last_name) as patient_name,
    m.name as medication_name,
    mo.estimated_delivery::DATE as estimated_delivery,
    mo.fulfillment_status,
    CASE 
        WHEN ma.supply_days IS NULL THEN NULL
        WHEN mo.estimated_delivery IS NULL THEN NULL
        ELSE (mo.estimated_delivery::DATE + INTERVAL '1 day' * ma.supply_days)::DATE
    END as expires_on,
    CASE 
        WHEN ma.supply_days IS NULL OR mo.estimated_delivery IS NULL THEN 'N/A'
        WHEN (mo.estimated_delivery::DATE + INTERVAL '1 day' * ma.supply_days) <= CURRENT_DATE THEN 'EXPIRED'
        WHEN (mo.estimated_delivery::DATE + INTERVAL '1 day' * ma.supply_days) <= CURRENT_DATE + INTERVAL '7 days' THEN 'EXPIRING_SOON'
        ELSE 'ACTIVE'
    END as renewal_status
FROM public.medication_approvals ma
JOIN public.medication_orders mo ON ma.id = mo.approval_id
JOIN public.patient_medication_preferences pmp ON ma.preference_id = pmp.id
JOIN public.medications m ON pmp.medication_id = m.id
JOIN public.patients pt ON pmp.patient_id = pt.id
JOIN public.profiles p ON pt.profile_id = p.id
WHERE ma.status IN ('approved', 'pending');

-- Add comments for documentation
COMMENT ON FUNCTION public.reset_expired_approvals IS 'Automatically resets approved medication approvals to pending when supply period has elapsed';
COMMENT ON FUNCTION public.get_approvals_due_for_renewal IS 'Returns list of approvals that are due for renewal based on supply expiry';
COMMENT ON FUNCTION public.trigger_approval_reset IS 'Manually triggers the approval reset process for testing';
COMMENT ON VIEW public.approval_renewal_status IS 'View showing renewal status of all medication approvals';

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.reset_expired_approvals() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_approvals_due_for_renewal() TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.trigger_approval_reset() TO anon, authenticated;
GRANT SELECT ON public.approval_renewal_status TO anon, authenticated;