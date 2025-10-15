-- Debug Script for Signup Trigger Issues
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Check if the trigger function exists
SELECT 
    routine_name,
    routine_type,
    routine_definition
FROM information_schema.routines 
WHERE routine_name = 'handle_new_user'
    AND routine_schema = 'public';

-- 2. Check if the trigger exists
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE trigger_name = 'on_auth_user_created';

-- 3. Check table structures
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'patients' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'providers' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'admins' 
    AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. Test a simple signup manually (replace with a test email)
-- This will help us see the exact error
/*
INSERT INTO auth.users (
    id, 
    instance_id, 
    aud, 
    role, 
    email, 
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    '00000000-0000-0000-0000-000000000000',
    'authenticated',
    'authenticated',
    'test-admin@example.com',
    NOW(),
    '{"role": "admin", "first_name": "Test", "last_name": "Admin"}'::jsonb,
    NOW(),
    NOW()
);
*/