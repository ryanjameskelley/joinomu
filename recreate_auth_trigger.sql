-- Recreate the auth trigger if it's missing
-- This ensures the trigger is properly attached to auth.users

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Recreate the trigger
CREATE TRIGGER handle_new_user_trigger
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- Verify the trigger was created
SELECT 
    'Trigger Status' as check_type,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    CASE tgenabled 
        WHEN 'O' THEN 'Enabled'
        WHEN 'D' THEN 'Disabled'
        ELSE 'Unknown'
    END as status
FROM pg_trigger 
WHERE tgname = 'handle_new_user_trigger';

-- Also verify the function exists
SELECT 
    'Function Status' as check_type,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
        THEN 'Function exists'
        ELSE 'Function missing'
    END as status;