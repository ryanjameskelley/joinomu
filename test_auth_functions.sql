-- Test if auth functions exist and work
SELECT 
    'Function Check' as test_type,
    routine_name,
    routine_type
FROM information_schema.routines 
WHERE routine_name IN ('handle_new_user', 'assign_provider_with_fallback')
ORDER BY routine_name;

-- Check if licensed column exists
SELECT 
    'Column Check' as test_type,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'providers' AND column_name = 'licensed';

-- Check if there are any providers
SELECT 
    'Provider Count' as test_type,
    COUNT(*) as count
FROM providers;