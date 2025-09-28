-- Fix the ON CONFLICT issue in the auth trigger

-- First check what the actual constraint looks like
DO $$
DECLARE
    constraint_info RECORD;
BEGIN
    RAISE NOTICE '=== CHECKING PROVIDER_SCHEDULES CONSTRAINTS ===';
    
    -- Check unique constraints
    FOR constraint_info IN (
        SELECT conname, pg_get_constraintdef(oid) as definition
        FROM pg_constraint 
        WHERE conrelid = 'public.provider_schedules'::regclass
        AND contype IN ('u', 'p')  -- unique or primary key
    ) LOOP
        RAISE NOTICE 'Constraint: % - %', constraint_info.conname, constraint_info.definition;
    END LOOP;
END $$;

-- Fix the auth trigger to use the correct constraint or remove ON CONFLICT entirely
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    first_name_val TEXT;
    last_name_val TEXT;
    phone_val TEXT;
    specialty_val TEXT;
    license_number_val TEXT;
    new_provider_id UUID;
    schedule_count INTEGER := 0;
    existing_schedules INTEGER := 0;
    profile_created BOOLEAN := FALSE;
    provider_created BOOLEAN := FALSE;
    schedules_created BOOLEAN := FALSE;
BEGIN
    -- Log that trigger started
    INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
    VALUES (NEW.id, 'TRIGGER_START', true, jsonb_build_object(
        'email', NEW.email,
        'raw_user_meta_data', NEW.raw_user_meta_data
    ));

    -- Extract and validate role
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    
    -- Extract user info with multiple fallbacks
    first_name_val := COALESCE(
        NEW.raw_user_meta_data->>'firstName',
        NEW.raw_user_meta_data->>'first_name',
        NEW.raw_user_meta_data->>'firstname',
        split_part(NEW.email, '@', 1)  -- Fallback to email prefix
    );
    
    last_name_val := COALESCE(
        NEW.raw_user_meta_data->>'lastName',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'lastname',
        'User'  -- Default fallback
    );
    
    phone_val := NEW.raw_user_meta_data->>'phone';
    specialty_val := NEW.raw_user_meta_data->>'specialty';
    license_number_val := COALESCE(
        NEW.raw_user_meta_data->>'licenseNumber',
        NEW.raw_user_meta_data->>'license_number'
    );

    -- Log extracted data
    INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
    VALUES (NEW.id, 'DATA_EXTRACTED', true, jsonb_build_object(
        'role', user_role,
        'first_name', first_name_val,
        'last_name', last_name_val,
        'has_phone', phone_val IS NOT NULL,
        'has_specialty', specialty_val IS NOT NULL
    ));

    -- Create profile with explicit error handling
    BEGIN
        INSERT INTO public.profiles (id, email, role, first_name, last_name, created_at)
        VALUES (NEW.id, NEW.email, user_role, first_name_val, last_name_val, NOW());
        
        profile_created := TRUE;
        
        INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
        VALUES (NEW.id, 'PROFILE_CREATED', true, jsonb_build_object(
            'profile_id', NEW.id,
            'role', user_role
        ));
        
    EXCEPTION WHEN OTHERS THEN
        INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, error_message, metadata)
        VALUES (NEW.id, 'PROFILE_CREATE_FAILED', false, SQLERRM, jsonb_build_object(
            'sql_state', SQLSTATE,
            'error_detail', SQLERRM
        ));
        -- Continue execution even if profile creation fails
    END;

    -- Handle role-specific records
    IF user_role = 'provider' AND profile_created THEN
        BEGIN
            -- Create provider record
            INSERT INTO public.providers (profile_id, specialty, license_number, phone, active, created_at)
            VALUES (
                NEW.id, 
                COALESCE(specialty_val, 'General Practice'), 
                COALESCE(license_number_val, 'PENDING'), 
                phone_val, 
                true,
                NOW()
            )
            RETURNING id INTO new_provider_id;
            
            provider_created := TRUE;
            
            INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
            VALUES (NEW.id, 'PROVIDER_CREATED', true, jsonb_build_object(
                'provider_id', new_provider_id,
                'specialty', COALESCE(specialty_val, 'General Practice')
            ));
            
            -- Check if schedules already exist (in case of duplicate trigger calls)
            SELECT COUNT(*) INTO existing_schedules 
            FROM public.provider_schedules 
            WHERE provider_id = new_provider_id;
            
            IF existing_schedules = 0 THEN
                -- Create default schedules (Monday-Friday 9-5) WITHOUT ON CONFLICT (since constraint name issue)
                BEGIN
                    -- Insert each schedule individually to handle conflicts better
                    FOR day_num IN 1..5 LOOP
                        -- Check if this specific day already exists
                        IF NOT EXISTS (
                            SELECT 1 FROM public.provider_schedules 
                            WHERE provider_id = new_provider_id 
                            AND day_of_week = day_num
                        ) THEN
                            INSERT INTO public.provider_schedules (
                                provider_id, day_of_week, start_time, end_time, active, created_at
                            ) VALUES (
                                new_provider_id, day_num, '09:00:00'::TIME, '17:00:00'::TIME, true, NOW()
                            );
                            schedule_count := schedule_count + 1;
                        END IF;
                    END LOOP;
                    
                    schedules_created := (schedule_count >= 5);
                    
                    INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
                    VALUES (NEW.id, 'SCHEDULES_CREATED', schedules_created, jsonb_build_object(
                        'schedule_count', schedule_count,
                        'provider_id', new_provider_id,
                        'existing_schedules', existing_schedules
                    ));
                    
                EXCEPTION WHEN OTHERS THEN
                    INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, error_message, metadata)
                    VALUES (NEW.id, 'SCHEDULES_CREATE_FAILED', false, SQLERRM, jsonb_build_object(
                        'provider_id', new_provider_id,
                        'sql_state', SQLSTATE,
                        'existing_schedules', existing_schedules,
                        'schedule_count', schedule_count
                    ));
                END;
            ELSE
                INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
                VALUES (NEW.id, 'SCHEDULES_ALREADY_EXIST', true, jsonb_build_object(
                    'provider_id', new_provider_id,
                    'existing_schedules', existing_schedules
                ));
                schedules_created := TRUE;
            END IF;
            
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, error_message, metadata)
            VALUES (NEW.id, 'PROVIDER_CREATE_FAILED', false, SQLERRM, jsonb_build_object(
                'sql_state', SQLSTATE,
                'error_detail', SQLERRM
            ));
        END;
        
    ELSIF user_role = 'patient' AND profile_created THEN
        BEGIN
            INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at)
            VALUES (NEW.id, phone_val, false, NOW());
            
            INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
            VALUES (NEW.id, 'PATIENT_CREATED', true, jsonb_build_object(
                'patient_id', NEW.id
            ));
            
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, error_message, metadata)
            VALUES (NEW.id, 'PATIENT_CREATE_FAILED', false, SQLERRM, jsonb_build_object(
                'sql_state', SQLSTATE
            ));
        END;
        
    ELSIF user_role = 'admin' AND profile_created THEN
        BEGIN
            INSERT INTO public.admins (profile_id, permissions, active, created_at)
            VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true, NOW());
            
            INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
            VALUES (NEW.id, 'ADMIN_CREATED', true, jsonb_build_object(
                'admin_id', NEW.id
            ));
            
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, error_message, metadata)
            VALUES (NEW.id, 'ADMIN_CREATE_FAILED', false, SQLERRM, jsonb_build_object(
                'sql_state', SQLSTATE
            ));
        END;
    END IF;

    -- Log final status
    INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
    VALUES (NEW.id, 'TRIGGER_COMPLETE', true, jsonb_build_object(
        'profile_created', profile_created,
        'provider_created', provider_created,
        'schedules_created', schedules_created,
        'schedule_count', schedule_count,
        'existing_schedules', existing_schedules,
        'final_role', user_role
    ));

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    -- Ultimate fallback - log the error and continue
    INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, error_message, metadata)
    VALUES (NEW.id, 'TRIGGER_FATAL_ERROR', false, SQLERRM, jsonb_build_object(
        'sql_state', SQLSTATE,
        'error_context', 'Ultimate exception handler'
    ));
    
    -- Still return NEW to allow auth to continue
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Test the fixed trigger
DO $$
DECLARE
    test_user_id UUID;
    profile_count INTEGER;
    provider_count INTEGER;
    schedule_count INTEGER;
    log_count INTEGER;
BEGIN
    RAISE NOTICE '=== TESTING FIXED SCHEDULE CREATION ===';
    
    test_user_id := gen_random_uuid();
    
    RAISE NOTICE 'Test user ID: %', test_user_id;
    
    -- Direct insert into auth.users
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password,
        email_confirmed_at, confirmation_token, confirmation_sent_at,
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        test_user_id,
        'authenticated',
        'authenticated',
        'schedulefix.test@example.com',
        '$2a$10$example.encrypted.password.hash.here',
        NOW(), '', NOW(),
        '{"provider": "email", "providers": ["email"]}',
        '{"role": "provider", "firstName": "ScheduleFix", "lastName": "Test", "specialty": "Emergency Medicine"}',
        NOW(), NOW()
    );
    
    -- Wait for trigger
    PERFORM pg_sleep(1);
    
    -- Check results
    SELECT COUNT(*) INTO profile_count FROM public.profiles WHERE id = test_user_id;
    SELECT COUNT(*) INTO provider_count FROM public.providers WHERE profile_id = test_user_id;
    SELECT COUNT(*) INTO schedule_count FROM public.provider_schedules ps 
    JOIN public.providers p ON ps.provider_id = p.id 
    WHERE p.profile_id = test_user_id;
    SELECT COUNT(*) INTO log_count FROM public.auth_trigger_logs WHERE user_id = test_user_id;
    
    RAISE NOTICE 'Fixed schedule creation results:';
    RAISE NOTICE '  Profiles: %, Providers: %, Schedules: %, Logs: %', 
        profile_count, provider_count, schedule_count, log_count;
    
    -- Check final log
    DECLARE
        final_log RECORD;
    BEGIN
        SELECT metadata INTO final_log 
        FROM public.auth_trigger_logs 
        WHERE user_id = test_user_id AND trigger_stage = 'TRIGGER_COMPLETE';
        
        IF final_log IS NOT NULL THEN
            RAISE NOTICE 'Final status: %', final_log.metadata;
        END IF;
    END;
    
    -- Cleanup
    DELETE FROM public.provider_schedules WHERE provider_id IN (
        SELECT id FROM public.providers WHERE profile_id = test_user_id
    );
    DELETE FROM public.providers WHERE profile_id = test_user_id;
    DELETE FROM public.profiles WHERE id = test_user_id;
    DELETE FROM public.auth_trigger_logs WHERE user_id = test_user_id;
    DELETE FROM auth.users WHERE id = test_user_id;
    
    RAISE NOTICE '✅ Test complete - cleanup done';
END $$;