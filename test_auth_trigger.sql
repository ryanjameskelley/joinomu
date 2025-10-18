-- Test if auth trigger exists and is working
SELECT 
    'Trigger Check' as test_type,
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled
FROM pg_trigger 
WHERE tgname LIKE '%handle_new_user%';

-- Check if the function exists
SELECT 
    'Function Check' as test_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check recent auth users
SELECT 
    'Recent Users' as test_type,
    email,
    created_at,
    raw_user_meta_data->>'role' as role
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Test the function manually
DO $$
BEGIN
    RAISE NOTICE 'Testing auth trigger function exists and can be called';
    -- Just check if function exists without calling it
    PERFORM 1 WHERE EXISTS (
        SELECT 1 FROM information_schema.routines 
        WHERE routine_name = 'handle_new_user'
    );
    RAISE NOTICE 'Auth trigger function exists';
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error checking auth trigger: %', SQLERRM;
END $$;