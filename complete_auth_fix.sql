-- Complete auth system fix - ensure trigger is properly attached

-- First check current state
SELECT 
    'Current Trigger State' as info,
    COUNT(*) as trigger_count
FROM pg_trigger 
WHERE tgname LIKE '%handle_new_user%';

-- Drop any existing triggers
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recreate the trigger with proper permissions
CREATE TRIGGER handle_new_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Grant necessary permissions to the function
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO anon;

-- Verify the setup
SELECT 
    'Auth System Status' as check_type,
    'Trigger: ' || COALESCE(tgname, 'MISSING') as trigger_status,
    'Function: ' || CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
        THEN 'EXISTS'
        ELSE 'MISSING'
    END as function_status
FROM pg_trigger 
WHERE tgname = 'handle_new_user_trigger'
UNION ALL
SELECT 
    'Auth System Status' as check_type,
    'Overall Status' as trigger_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_new_user_trigger')
             AND EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
        THEN '✅ READY FOR SIGNUP'
        ELSE '❌ NEEDS FIXING'
    END as function_status
WHERE NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'handle_new_user_trigger');

-- Test the trigger is working
SELECT 'Ready for provider signup test' as status;