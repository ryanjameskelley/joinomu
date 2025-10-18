-- Create a test provider manually to verify the system works
-- This will help us test patient assignment

-- First create a test profile
INSERT INTO profiles (id, email, first_name, last_name, role, created_at, updated_at)
VALUES (
    gen_random_uuid(),
    'testprovider@example.com',
    'Test',
    'Provider',
    'provider',
    NOW(),
    NOW()
) 
RETURNING id as profile_id;

-- Get the profile ID and create provider record
DO $$
DECLARE
    test_profile_id UUID;
    test_provider_id UUID;
BEGIN
    -- Get the profile we just created
    SELECT id INTO test_profile_id 
    FROM profiles 
    WHERE email = 'testprovider@example.com';
    
    -- Create provider record
    INSERT INTO providers (
        profile_id, 
        specialty, 
        license_number, 
        phone, 
        licensed, 
        active, 
        created_at, 
        updated_at
    ) VALUES (
        test_profile_id,
        'Internal Medicine',
        'MD12345',
        '555-0123',
        ARRAY['CA', 'NY', 'TX'],
        true,
        NOW(),
        NOW()
    )
    RETURNING id INTO test_provider_id;
    
    -- Create schedule
    INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, treatment_types, active, created_at, updated_at)
    VALUES
        (test_provider_id, 1, '09:00:00', '17:00:00', ARRAY['weight_loss'], true, NOW(), NOW()),
        (test_provider_id, 2, '09:00:00', '17:00:00', ARRAY['weight_loss'], true, NOW(), NOW()),
        (test_provider_id, 3, '09:00:00', '17:00:00', ARRAY['weight_loss'], true, NOW(), NOW()),
        (test_provider_id, 4, '09:00:00', '17:00:00', ARRAY['weight_loss'], true, NOW(), NOW()),
        (test_provider_id, 5, '09:00:00', '17:00:00', ARRAY['weight_loss'], true, NOW(), NOW());
    
    RAISE NOTICE 'Test provider created successfully: %', test_provider_id;
END $$;

-- Verify provider was created
SELECT COUNT(*) as provider_count FROM providers WHERE active = true;