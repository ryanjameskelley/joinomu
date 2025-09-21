-- Check All Table Structures for Trigger Compatibility

-- Check patients table structure
SELECT 'PATIENTS TABLE' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check providers table structure  
SELECT 'PROVIDERS TABLE' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'providers' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check admins table structure
SELECT 'ADMINS TABLE' as table_name, column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admins' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- Check if trigger exists
SELECT trigger_name, event_object_table, action_statement 
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- Check if function exists
SELECT proname, prosrc 
FROM pg_proc 
WHERE proname = 'handle_new_user';