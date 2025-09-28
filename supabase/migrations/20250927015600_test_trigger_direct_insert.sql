-- Test if trigger fires with direct insert to auth.users

DO $$
DECLARE
    test_user_id UUID;
    profile_count INTEGER;
    provider_count INTEGER;
    schedule_count INTEGER;
    log_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING AUTH TRIGGER WITH DIRECT INSERT ===';
    
    test_user_id := gen_random_uuid();
    
    RAISE NOTICE 'Test user ID: %', test_user_id;
    
    -- Direct insert into auth.users (simulating what Supabase auth does)
    BEGIN
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            test_user_id,
            'authenticated',
            'authenticated',
            'trigger.test@example.com',
            '$2a$10$example.encrypted.password.hash.here',
            NOW(),
            '',
            NOW(),
            '',
            NULL,
            '',
            '',
            NULL,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"role": "provider", "firstName": "Trigger", "lastName": "Test", "specialty": "Internal Medicine", "licenseNumber": "TRIGGER123"}',
            false,
            NOW(),
            NOW(),
            NULL,
            NULL,
            '',
            '',
            NULL,
            '',
            0,
            NULL,
            '',
            NULL,
            false,
            NULL
        );
        
        RAISE NOTICE '✅ User inserted successfully';
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ Failed to insert user: %', SQLERRM;
        RETURN;
    END;
    
    -- Wait a moment for trigger to execute
    PERFORM pg_sleep(1);
    
    -- Check what was created
    SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE id = test_user_id;
    SELECT COUNT(*) INTO provider_count FROM public.providers WHERE profile_id = test_user_id;
    SELECT COUNT(*) INTO schedule_count FROM public.provider_schedules ps 
    JOIN public.providers p ON ps.provider_id = p.id 
    WHERE p.profile_id = test_user_id;
    
    -- Check logs
    SELECT COUNT(*) INTO log_count FROM public.auth_trigger_logs WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Results after trigger execution:';
    RAISE NOTICE '  Profiles created: %', profile_count;
    RAISE NOTICE '  Providers created: %', provider_count;
    RAISE NOTICE '  Schedules created: %', schedule_count;
    RAISE NOTICE '  Log entries: %', log_count;
    
    -- Show log entries
    IF log_count > 0 THEN
        DECLARE
            log_rec RECORD;
        BEGIN
            RAISE NOTICE 'Trigger logs:';
            FOR log_rec IN (
                SELECT trigger_stage, success, error_message, metadata 
                FROM public.auth_trigger_logs 
                WHERE user_id = test_user_id 
                ORDER BY created_at
            ) LOOP
                RAISE NOTICE '  - %: % %', 
                    log_rec.trigger_stage, 
                    CASE WHEN log_rec.success THEN 'SUCCESS' ELSE 'FAILED' END,
                    COALESCE(log_rec.error_message, '');
                IF log_rec.metadata IS NOT NULL THEN
                    RAISE NOTICE '    Metadata: %', log_rec.metadata;
                END IF;
            END LOOP;
        END;
    ELSE
        RAISE NOTICE '❌ No trigger logs found - trigger may not have fired';
    END IF;
    
    -- Cleanup
    DELETE FROM public.provider_schedules WHERE provider_id IN (
        SELECT id FROM public.providers WHERE profile_id = test_user_id
    );
    DELETE FROM public.providers WHERE profile_id = test_user_id;
    DELETE FROM public.profiles WHERE id = test_user_id;
    DELETE FROM public.auth_trigger_logs WHERE user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE '✅ Cleanup complete';
    RAISE NOTICE '=== TEST COMPLETE ===';
    
END $$;