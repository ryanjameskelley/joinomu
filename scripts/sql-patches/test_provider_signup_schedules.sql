-- Test provider signup with automatic schedule creation
-- This simulates what happens when a provider signs up through Supabase Auth

DO $$
DECLARE
    test_user_id UUID := gen_random_uuid();
    test_email TEXT := 'test-provider-schedules@example.com';
    created_provider_id UUID;
    schedule_count INTEGER;
    i RECORD;
BEGIN
    RAISE NOTICE 'Testing provider signup with automatic schedule creation...';
    RAISE NOTICE 'Test user ID: %', test_user_id;
    RAISE NOTICE 'Test email: %', test_email;

    -- Test creating a provider user through auth.users (simulating Supabase Auth signup)
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
            'role', 'provider',
            'first_name', 'Test',
            'last_name', 'Provider',
            'specialty', 'Internal Medicine',
            'license_number', 'TEST123456',
            'phone', '+1234567890'
        ),
        NOW(),
        NOW(),
        NOW(),
        'authenticated',
        'authenticated'
    );

    RAISE NOTICE '✅ Successfully created auth user via trigger test';

    -- Check if provider was created
    SELECT id INTO created_provider_id
    FROM public.providers 
    WHERE profile_id = test_user_id;

    IF created_provider_id IS NOT NULL THEN
        RAISE NOTICE '✅ Provider record created with ID: %', created_provider_id;
        
        -- Check if schedules were automatically created
        SELECT COUNT(*) INTO schedule_count
        FROM public.provider_schedules 
        WHERE provider_id = created_provider_id;
        
        RAISE NOTICE '✅ Provider schedules created: % entries', schedule_count;
        
        -- Show the created schedules
        FOR i IN 
            SELECT day_of_week, start_time, end_time, treatment_types
            FROM public.provider_schedules 
            WHERE provider_id = created_provider_id
            ORDER BY day_of_week
        LOOP
            RAISE NOTICE '   Schedule: Day %, % - %, Types: %', 
                i.day_of_week, i.start_time, i.end_time, array_to_string(i.treatment_types, ',');
        END LOOP;
        
        IF schedule_count >= 5 THEN
            RAISE NOTICE '✅ SUCCESS: Provider signup created complete schedule (Mon-Fri)';
        ELSE
            RAISE NOTICE '❌ PARTIAL: Only % schedules created (expected 5)', schedule_count;
        END IF;
        
    ELSE
        RAISE NOTICE '❌ FAILED: No provider record was created';
    END IF;

EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '❌ Provider signup test failed: %', SQLERRM;
END $$;

-- Verify the complete record structure
SELECT 
    'Provider Signup Verification' as test_category,
    u.email,
    u.raw_user_meta_data->>'role' as auth_role,
    p.first_name || ' ' || p.last_name as profile_name,
    p.role as profile_role,
    prov.specialty,
    prov.license_number,
    prov.phone as provider_phone,
    prov.active as provider_active,
    COUNT(ps.id) as schedule_entries,
    CASE 
        WHEN u.id IS NOT NULL AND p.id IS NOT NULL AND prov.id IS NOT NULL AND COUNT(ps.id) >= 5
        THEN '✅ Complete - All records created with schedules'
        WHEN u.id IS NOT NULL AND p.id IS NOT NULL AND prov.id IS NOT NULL
        THEN '⚠️ Partial - Missing schedules'
        ELSE '❌ Incomplete - Missing records'
    END as creation_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id  
LEFT JOIN public.providers prov ON u.id = prov.profile_id
LEFT JOIN public.provider_schedules ps ON prov.id = ps.provider_id
WHERE u.email = 'test-provider-schedules@example.com'
GROUP BY u.email, u.raw_user_meta_data, p.first_name, p.last_name, p.role, 
         prov.specialty, prov.license_number, prov.phone, prov.active, u.id, p.id, prov.id;

-- Clean up test data
DELETE FROM auth.users WHERE email = 'test-provider-schedules@example.com';

DO $$
BEGIN
    RAISE NOTICE '✅ Test cleanup complete';
END $$;