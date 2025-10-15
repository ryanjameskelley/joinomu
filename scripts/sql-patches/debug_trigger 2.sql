-- Debug auth trigger status
-- Check if trigger exists
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT 
    routine_name, 
    routine_type, 
    specific_name,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user';

-- Check recent auth.users entries
SELECT 
    id, 
    email, 
    created_at,
    raw_user_meta_data
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Check profiles table for recent entries  
SELECT 
    id, 
    email, 
    role, 
    created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Check patients table for recent entries
SELECT 
    id, 
    profile_id, 
    created_at
FROM public.patients 
ORDER BY created_at DESC 
LIMIT 5;