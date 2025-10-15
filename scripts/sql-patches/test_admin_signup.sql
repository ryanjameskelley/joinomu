-- Test admin signup to verify the auth trigger works for all user types
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test-admin-complete@example.com';
BEGIN
    RAISE NOTICE 'Testing admin signup with complete auth trigger...';
    RAISE NOTICE 'Test admin ID: %', test_user_id;
    RAISE NOTICE 'Test email: %', test_email;

    -- Test creating an admin user through auth.users (simulating Supabase Auth signup)
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
        jsonb_build_object(
            'role', 'admin',
            'first_name', 'Test',
            'last_name', 'Admin'
        ),
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );

    RAISE NOTICE '✅ Admin user created successfully via auth trigger';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Admin signup test failed: %', SQLERRM;
END $$;

-- Verify admin signup created all necessary records
SELECT 
    'Admin Signup Verification' as test_category,
    u.email,
    u.raw_user_meta_data->>'role' as auth_role,
    p.first_name || ' ' || p.last_name as profile_name,
    p.role as profile_role,
    a.permissions,
    a.active as admin_active,
    CASE 
        WHEN u.id IS NOT NULL AND p.id IS NOT NULL AND a.id IS NOT NULL
        THEN '✅ Complete - All admin records created'
        ELSE '❌ Incomplete - Missing records'
    END as creation_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  
LEFT JOIN public.admins a ON u.id = a.profile_id
WHERE u.email = 'test-admin-complete@example.com';

-- Test patient signup too for completeness
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test-patient-complete@example.com';
BEGIN
    RAISE NOTICE 'Testing patient signup with complete auth trigger...';

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
        jsonb_build_object(
            'role', 'patient',
            'first_name', 'Test',
            'last_name', 'Patient',
            'phone', '+1234567890'
        ),
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );

    RAISE NOTICE '✅ Patient user created successfully via auth trigger';

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Patient signup test failed: %', SQLERRM;
END $$;

-- Verify patient signup 
SELECT 
    'Patient Signup Verification' as test_category,
    u.email,
    p.first_name || ' ' || p.last_name as profile_name,
    p.role as profile_role,
    pt.phone,
    pt.has_completed_intake,
    CASE 
        WHEN u.id IS NOT NULL AND p.id IS NOT NULL AND pt.id IS NOT NULL
        THEN '✅ Complete - All patient records created'
        ELSE '❌ Incomplete - Missing records'
    END as creation_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  
LEFT JOIN public.patients pt ON u.id = pt.profile_id
WHERE u.email = 'test-patient-complete@example.com';

-- Clean up test data
DELETE FROM auth.users WHERE email IN (
    'test-admin-complete@example.com', 
    'test-patient-complete@example.com'
);

DO $$
BEGIN
    RAISE NOTICE '✅ End-to-end auth trigger tests complete';
END $$;