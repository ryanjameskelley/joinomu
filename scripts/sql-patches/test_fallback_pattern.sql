-- Test the Auth Service Fallback Pattern by simulating what our auth service does
-- This tests the exact same operations our service role client performs

-- Step 1: Simulate creating an auth user (like supabase.auth.signUp does)
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'fallback-test@example.com';
BEGIN
    -- Create auth user
    INSERT INTO auth.users (
        id,
        email,
        encrypted_password,
        raw_user_meta_data,
        email_confirmed_at,
        created_at,
        updated_at,
        aud,
        role
    ) VALUES (
        test_user_id,
        test_email,
        crypt('testpass', gen_salt('bf')),
        '{"role": "admin", "first_name": "Fallback", "last_name": "Test"}'::jsonb,
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );

    -- Step 2: Test fallback pattern record creation using service role permissions
    -- This simulates what our supabaseService client does
    
    -- Create profile (what our auth service does)
    INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (test_user_id, test_email, 'Fallback', 'Test', 'admin', NOW(), NOW());

    -- Create admin record (what our auth service does)
    INSERT INTO public.admins (profile_id, permissions, active, created_at, updated_at)
    VALUES (test_user_id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true, NOW(), NOW());

    RAISE NOTICE '✅ Successfully created auth user and records via fallback pattern';
    RAISE NOTICE '   User ID: %', test_user_id;
    RAISE NOTICE '   Email: %', test_email;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Fallback pattern test failed: %', SQLERRM;
END $$;

-- Verify the test worked
SELECT 
    'Fallback Pattern Test Results' as test_category,
    u.email,
    u.raw_user_meta_data->>'role' as auth_role,
    p.first_name || ' ' || p.last_name as profile_name,
    p.role as profile_role,
    a.active as admin_active,
    array_length(a.permissions, 1) as permission_count
FROM auth.users u
JOIN public.profiles p ON u.id = p.id  
JOIN public.admins a ON u.id = a.profile_id
WHERE u.email = 'fallback-test@example.com';

-- Clean up test data
DELETE FROM auth.users WHERE email = 'fallback-test@example.com';