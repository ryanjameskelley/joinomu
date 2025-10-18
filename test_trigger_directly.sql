-- Test if the auth trigger is actually firing
-- Add more logging to see what's happening

-- First verify the trigger exists and is enabled
SELECT 
    tgname as trigger_name,
    tgrelid::regclass as table_name,
    tgenabled as enabled,
    tgfoid::regproc as function_name
FROM pg_trigger 
WHERE tgname = 'handle_new_user_trigger';

-- Test by manually inserting into auth.users to see if trigger fires
-- (This will help us see if the trigger is working)
DO $$
BEGIN
    RAISE NOTICE 'Testing trigger by attempting manual insert...';
    
    -- Try to insert a test user to see if trigger fires
    INSERT INTO auth.users (
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_user_meta_data,
        created_at,
        updated_at
    ) VALUES (
        gen_random_uuid(),
        'authenticated',
        'authenticated',
        'test-trigger@example.com',
        crypt('testpassword', gen_salt('bf')),
        NOW(),
        '{"role": "provider", "first_name": "Test", "last_name": "Provider", "licensed": ["CA"]}'::jsonb,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Manual insert completed - check if trigger fired';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error during manual insert: %', SQLERRM;
END $$;

-- Check if the test user was created and if profile was created by trigger
SELECT 
    'Test Results' as check_type,
    u.email,
    u.raw_user_meta_data->>'role' as role,
    CASE WHEN p.id IS NOT NULL THEN 'Profile Created' ELSE 'No Profile' END as profile_status
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'test-trigger@example.com';