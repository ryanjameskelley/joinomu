-- Check what happened with the specific user signup
SELECT 
    step,
    status,
    error_message,
    metadata,
    created_at
FROM public.auth_trigger_debug_log 
WHERE user_id = '2be9df1b-b453-4586-b0c6-7739b4ca56a8'
ORDER BY created_at;

-- Also check if trigger exists and is active
SELECT 
    trigger_name, 
    event_manipulation, 
    event_object_table, 
    action_timing,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';