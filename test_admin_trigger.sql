-- Test admin user creation to debug the trigger issue
-- This will help us see what's failing in the auth trigger

BEGIN;

-- Create a test admin user to see what happens
INSERT INTO auth.users (
    id,
    email,
    encrypted_password,
    raw_user_meta_data,
    email_confirmed_at,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'test-admin@debug.com',
    crypt('test123', gen_salt('bf')),
    '{"role": "admin", "firstName": "Test", "lastName": "Admin"}'::jsonb,
    NOW(),
    NOW(),
    NOW()
);

-- Check if the trigger logs show any errors
SELECT 
    user_id, 
    trigger_stage, 
    success, 
    error_message, 
    metadata 
FROM auth_trigger_logs 
WHERE user_id IN (
    SELECT id FROM auth.users WHERE email = 'test-admin@debug.com'
)
ORDER BY created_at DESC;

-- Check if profile was created
SELECT 
    p.id, 
    p.email, 
    p.role, 
    p.first_name, 
    p.last_name 
FROM profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'test-admin@debug.com';

-- Check if admin record was created
SELECT 
    a.id, 
    a.profile_id, 
    a.permissions, 
    a.active 
FROM admins a 
JOIN profiles p ON a.profile_id = p.id 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = 'test-admin@debug.com';

-- Clean up the test
DELETE FROM auth.users WHERE email = 'test-admin@debug.com';

ROLLBACK;