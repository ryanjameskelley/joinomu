-- Fix schedule trigger conflict by removing separate provider trigger
-- The auth trigger already handles schedule creation comprehensively

-- Drop the separate provider schedule trigger since auth trigger handles it
DROP TRIGGER IF EXISTS on_provider_created ON public.providers;
DROP FUNCTION IF EXISTS create_provider_schedule();

-- Verify the triggers are cleaned up
SELECT 
    'Provider Trigger Status' as status_check,
    COUNT(*) as trigger_count
FROM pg_trigger 
WHERE tgrelid = 'public.providers'::regclass 
  AND tgname = 'on_provider_created';

-- Show remaining triggers on providers table (should only be constraint triggers and updated_at)
SELECT 
    'Remaining Triggers' as trigger_category,
    tgname as trigger_name,
    CASE tgenabled 
        WHEN 'O' THEN 'enabled'
        WHEN 'D' THEN 'disabled'
        ELSE 'unknown'
    END as status
FROM pg_trigger 
WHERE tgrelid = 'public.providers'::regclass 
  AND tgname NOT LIKE 'RI_ConstraintTrigger%'
ORDER BY tgname;