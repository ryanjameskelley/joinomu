-- Test the restored authentication trigger
DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'trigger-test-patient@example.com';
BEGIN
    -- Test creating a patient user through auth.users (simulating Supabase Auth signup)
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
        '{"role": "patient", "first_name": "Test", "last_name": "Patient", "phone": "+1234567890"}'::jsonb,
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );

    RAISE NOTICE '✅ Successfully created auth user via trigger test';
    RAISE NOTICE '   User ID: %', test_user_id;
    RAISE NOTICE '   Email: %', test_email;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Trigger test failed: %', SQLERRM;
END $$;

-- Verify the trigger created all necessary records
SELECT 
    'Trigger Test Results' as test_category,
    u.email,
    u.raw_user_meta_data->>'role' as auth_role,
    p.first_name || ' ' || p.last_name as profile_name,
    p.role as profile_role,
    pat.phone as patient_phone,
    pat.has_completed_intake as patient_intake_status,
    CASE 
        WHEN u.id IS NOT NULL AND p.id IS NOT NULL AND pat.id IS NOT NULL 
        THEN '✅ Complete - All records created'
        ELSE '❌ Incomplete - Missing records'
    END as creation_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  
LEFT JOIN public.patients pat ON u.id = pat.profile_id
WHERE u.email = 'trigger-test-patient@example.com';

-- Clean up test data
DELETE FROM auth.users WHERE email = 'trigger-test-patient@example.com';