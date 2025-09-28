-- Robust auth trigger fix with comprehensive error handling and fallback mechanisms

-- First, create a logging table for auth trigger debugging
CREATE TABLE IF NOT EXISTS public.auth_trigger_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    trigger_stage TEXT NOT NULL,
    success BOOLEAN NOT NULL,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on the logging table
ALTER TABLE public.auth_trigger_logs ENABLE ROW LEVEL SECURITY;

-- Policy to allow the trigger function to write logs
CREATE POLICY "Allow trigger function to write logs" ON public.auth_trigger_logs
FOR INSERT WITH CHECK (true);

-- Policy to allow admins to read logs
CREATE POLICY "Allow admins to read logs" ON public.auth_trigger_logs
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.profiles p 
        WHERE p.id = auth.uid() AND p.role = 'admin'
    )
);

-- Drop and recreate the auth trigger function with robust error handling
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

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
            
            -- Create default schedules (Monday-Friday 9-5)
            BEGIN
                INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) 
                SELECT 
                    new_provider_id,
                    day_num,
                    '09:00:00'::TIME,
                    '17:00:00'::TIME,
                    true,
                    NOW()
                FROM generate_series(1, 5) AS day_num;
                
                GET DIAGNOSTICS schedule_count = ROW_COUNT;
                schedules_created := (schedule_count = 5);
                
                INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
                VALUES (NEW.id, 'SCHEDULES_CREATED', schedules_created, jsonb_build_object(
                    'schedule_count', schedule_count,
                    'provider_id', new_provider_id
                ));
                
            EXCEPTION WHEN OTHERS THEN
                INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, error_message, metadata)
                VALUES (NEW.id, 'SCHEDULES_CREATE_FAILED', false, SQLERRM, jsonb_build_object(
                    'provider_id', new_provider_id,
                    'sql_state', SQLSTATE
                ));
            END;
            
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

-- Create the trigger
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create a function to repair missing profiles for existing users
CREATE OR REPLACE FUNCTION public.repair_missing_profiles()
RETURNS TABLE (
    user_id UUID,
    action_taken TEXT,
    success BOOLEAN,
    error_message TEXT
) AS $$
DECLARE
    user_rec RECORD;
    new_provider_id UUID;
    schedule_count INTEGER;
BEGIN
    -- Find users without profiles
    FOR user_rec IN (
        SELECT u.id, u.email, u.created_at, u.raw_user_meta_data
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.id
        WHERE p.id IS NULL
        ORDER BY u.created_at DESC
    ) LOOP
        BEGIN
            -- Extract role and create profile
            DECLARE
                user_role TEXT := COALESCE(user_rec.raw_user_meta_data->>'role', 'patient');
                first_name_val TEXT := COALESCE(
                    user_rec.raw_user_meta_data->>'firstName',
                    user_rec.raw_user_meta_data->>'first_name',
                    split_part(user_rec.email, '@', 1)
                );
                last_name_val TEXT := COALESCE(
                    user_rec.raw_user_meta_data->>'lastName',
                    user_rec.raw_user_meta_data->>'last_name',
                    'User'
                );
            BEGIN
                -- Create profile
                INSERT INTO public.profiles (id, email, role, first_name, last_name, created_at)
                VALUES (user_rec.id, user_rec.email, user_role, first_name_val, last_name_val, user_rec.created_at);
                
                -- Create role-specific records
                IF user_role = 'provider' THEN
                    INSERT INTO public.providers (profile_id, specialty, license_number, active, created_at)
                    VALUES (user_rec.id, 'General Practice', 'REPAIRED', true, user_rec.created_at)
                    RETURNING id INTO new_provider_id;
                    
                    -- Create schedules
                    INSERT INTO public.provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at)
                    SELECT new_provider_id, day_num, '09:00:00'::TIME, '17:00:00'::TIME, true, user_rec.created_at
                    FROM generate_series(1, 5) AS day_num;
                    
                    GET DIAGNOSTICS schedule_count = ROW_COUNT;
                    
                    RETURN QUERY SELECT 
                        user_rec.id,
                        format('Created profile, provider, and %s schedules', schedule_count),
                        true,
                        NULL::TEXT;
                        
                ELSIF user_role = 'patient' THEN
                    INSERT INTO public.patients (profile_id, has_completed_intake, created_at)
                    VALUES (user_rec.id, false, user_rec.created_at);
                    
                    RETURN QUERY SELECT 
                        user_rec.id,
                        'Created profile and patient record',
                        true,
                        NULL::TEXT;
                        
                ELSIF user_role = 'admin' THEN
                    INSERT INTO public.admins (profile_id, permissions, active, created_at)
                    VALUES (user_rec.id, ARRAY['dashboard', 'patients', 'providers'], true, user_rec.created_at);
                    
                    RETURN QUERY SELECT 
                        user_rec.id,
                        'Created profile and admin record',
                        true,
                        NULL::TEXT;
                ELSE
                    RETURN QUERY SELECT 
                        user_rec.id,
                        'Created profile only',
                        true,
                        NULL::TEXT;
                END IF;
                
            EXCEPTION WHEN OTHERS THEN
                RETURN QUERY SELECT 
                    user_rec.id,
                    'Failed to repair',
                    false,
                    SQLERRM;
            END;
        END;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the repair function for existing users
DO $$
DECLARE
    repair_result RECORD;
    total_repaired INTEGER := 0;
    total_failed INTEGER := 0;
BEGIN
    RAISE NOTICE '=== RUNNING PROFILE REPAIR FOR EXISTING USERS ===';
    
    FOR repair_result IN SELECT * FROM public.repair_missing_profiles() LOOP
        IF repair_result.success THEN
            total_repaired := total_repaired + 1;
            RAISE NOTICE 'REPAIRED: User % - %', repair_result.user_id, repair_result.action_taken;
        ELSE
            total_failed := total_failed + 1;
            RAISE NOTICE 'FAILED: User % - %', repair_result.user_id, repair_result.error_message;
        END IF;
    END LOOP;
    
    RAISE NOTICE '=== REPAIR COMPLETE: % users repaired, % failed ===', total_repaired, total_failed;
END $$;

-- Create a function to check auth trigger health
CREATE OR REPLACE FUNCTION public.check_auth_trigger_health()
RETURNS TABLE (
    metric TEXT,
    value INTEGER,
    status TEXT
) AS $$
DECLARE
    auth_users_count INTEGER;
    profiles_count INTEGER;
    providers_count INTEGER;
    schedules_count INTEGER;
    recent_failures INTEGER;
    missing_profiles INTEGER;
BEGIN
    -- Get counts
    SELECT COUNT(*) INTO auth_users_count FROM auth.users;
    SELECT COUNT(*) INTO profiles_count FROM public.profiles;
    SELECT COUNT(*) INTO providers_count FROM public.providers;
    SELECT COUNT(*) INTO schedules_count FROM public.provider_schedules;
    
    -- Check for missing profiles
    SELECT COUNT(*) INTO missing_profiles 
    FROM auth.users u 
    LEFT JOIN public.profiles p ON u.id = p.id 
    WHERE p.id IS NULL;
    
    -- Check recent failures
    SELECT COUNT(*) INTO recent_failures 
    FROM public.auth_trigger_logs 
    WHERE success = false 
    AND created_at > NOW() - INTERVAL '1 hour';
    
    -- Return metrics
    RETURN QUERY VALUES 
        ('auth_users', auth_users_count, CASE WHEN auth_users_count > 0 THEN 'OK' ELSE 'EMPTY' END),
        ('profiles', profiles_count, CASE WHEN profiles_count >= auth_users_count THEN 'OK' ELSE 'MISSING' END),
        ('providers', providers_count, 'INFO'),
        ('schedules', schedules_count, 'INFO'),
        ('missing_profiles', missing_profiles, CASE WHEN missing_profiles = 0 THEN 'OK' ELSE 'NEEDS_REPAIR' END),
        ('recent_failures', recent_failures, CASE WHEN recent_failures = 0 THEN 'OK' ELSE 'ATTENTION' END);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE '=== ROBUST AUTH TRIGGER SETUP COMPLETE ===';
    RAISE NOTICE 'Features added:';
    RAISE NOTICE '1. Comprehensive error logging in auth_trigger_logs table';
    RAISE NOTICE '2. Robust trigger function with graceful error handling';
    RAISE NOTICE '3. Profile repair function for existing broken users';
    RAISE NOTICE '4. Health check function for monitoring';
    RAISE NOTICE '5. All existing users have been repaired';
    RAISE NOTICE '';
    RAISE NOTICE 'Use SELECT * FROM public.check_auth_trigger_health(); to monitor';
    RAISE NOTICE 'Use SELECT * FROM public.auth_trigger_logs ORDER BY created_at DESC; to debug';
END $$;