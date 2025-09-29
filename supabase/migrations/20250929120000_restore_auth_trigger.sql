-- Restore the authentication trigger that was dropped
-- This ensures new user signups create proper profile and role records

-- Recreate the handle_new_user function with explicit schema references
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    first_name TEXT;
    last_name TEXT;
    phone_val TEXT;
    specialty_val TEXT;
    license_number_val TEXT;
    new_provider_id UUID;
BEGIN
    -- Log trigger execution
    INSERT INTO public.auth_trigger_logs (user_id, raw_metadata, step, status, error_details, created_at)
    VALUES (NEW.id, NEW.raw_user_meta_data::text, 'TRIGGER_START', 'SUCCESS', NULL, NOW());

    -- Extract data from raw_user_meta_data only
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    first_name := COALESCE(NEW.raw_user_meta_data->>'first_name', NEW.raw_user_meta_data->>'firstName', 'User');
    last_name := COALESCE(NEW.raw_user_meta_data->>'last_name', NEW.raw_user_meta_data->>'lastName', 'Unknown');
    phone_val := NEW.raw_user_meta_data->>'phone';
    specialty_val := NEW.raw_user_meta_data->>'specialty';
    license_number_val := COALESCE(NEW.raw_user_meta_data->>'license_number', NEW.raw_user_meta_data->>'licenseNumber');

    -- Log data extraction
    INSERT INTO public.auth_trigger_logs (user_id, raw_metadata, step, status, error_details, created_at)
    VALUES (NEW.id, jsonb_build_object('role', user_role, 'first_name', first_name, 'last_name', last_name)::text, 'DATA_EXTRACTED', 'SUCCESS', NULL, NOW());

    -- Create profile first with explicit schema reference
    INSERT INTO public.profiles (id, email, first_name, last_name, role, created_at, updated_at)
    VALUES (NEW.id, NEW.email, first_name, last_name, user_role, NOW(), NOW());

    -- Log profile creation
    INSERT INTO public.auth_trigger_logs (user_id, raw_metadata, step, status, error_details, created_at)
    VALUES (NEW.id, jsonb_build_object('role', user_role, 'profile_id', NEW.id)::text, 'PROFILE_CREATED', 'SUCCESS', NULL, NOW());

    -- Create role-specific records with explicit schema references
    IF user_role = 'patient' THEN
        INSERT INTO public.patients (profile_id, phone, has_completed_intake, created_at, updated_at)
        VALUES (NEW.id, phone_val, false, NOW(), NOW());

        -- Log patient creation
        INSERT INTO public.auth_trigger_logs (user_id, raw_metadata, step, status, error_details, created_at)
        VALUES (NEW.id, jsonb_build_object('has_phone', phone_val IS NOT NULL)::text, 'PATIENT_CREATED', 'SUCCESS', NULL, NOW());

    ELSIF user_role = 'provider' THEN
        INSERT INTO public.providers (profile_id, specialty, license_number, phone, active, created_at, updated_at)
        VALUES (NEW.id, specialty_val, license_number_val, phone_val, true, NOW(), NOW())
        RETURNING id INTO new_provider_id;

        -- Log provider creation
        INSERT INTO public.auth_trigger_logs (user_id, raw_metadata, step, status, error_details, created_at)
        VALUES (NEW.id, jsonb_build_object('specialty', specialty_val, 'provider_id', new_provider_id)::text, 'PROVIDER_CREATED', 'SUCCESS', NULL, NOW());

        -- Try to create provider schedule with error handling
        BEGIN
            PERFORM public.create_default_provider_schedule();
            INSERT INTO public.auth_trigger_logs (user_id, raw_metadata, step, status, error_details, created_at)
            VALUES (NEW.id, jsonb_build_object('provider_id', new_provider_id)::text, 'SCHEDULES_CREATED', 'SUCCESS', NULL, NOW());
        EXCEPTION WHEN OTHERS THEN
            INSERT INTO public.auth_trigger_logs (user_id, raw_metadata, step, status, error_details, created_at)
            VALUES (NEW.id, jsonb_build_object('sql_state', SQLSTATE, 'provider_id', new_provider_id)::text, 'SCHEDULES_CREATE_FAILED', 'FAILED', SQLERRM, NOW());
            -- Don't fail the entire signup for schedule creation failures
        END;

    ELSIF user_role = 'admin' THEN
        INSERT INTO public.admins (profile_id, permissions, active, created_at, updated_at)
        VALUES (NEW.id, ARRAY['dashboard', 'patients', 'providers', 'assignments'], true, NOW(), NOW());

        -- Log admin creation
        INSERT INTO public.auth_trigger_logs (user_id, raw_metadata, step, status, error_details, created_at)
        VALUES (NEW.id, jsonb_build_object('permissions', 'full_admin')::text, 'ADMIN_CREATED', 'SUCCESS', NULL, NOW());

    END IF;

    -- Final success log
    INSERT INTO public.auth_trigger_logs (user_id, raw_metadata, step, status, error_details, created_at)
    VALUES (NEW.id, jsonb_build_object('final_role', user_role)::text, 'TRIGGER_COMPLETE', 'SUCCESS', NULL, NOW());

    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log the error
        INSERT INTO public.auth_trigger_logs (user_id, raw_metadata, step, status, error_details, created_at)
        VALUES (NEW.id, NEW.raw_user_meta_data::text, 'TRIGGER_ERROR', 'FAILED', SQLERRM, NOW());
        
        RAISE LOG 'Error in handle_new_user trigger for user %: % - %', NEW.id, SQLSTATE, SQLERRM;
        RAISE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recreate the trigger on auth.users table
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Test the trigger is working
SELECT 
  'Auth trigger restoration complete' as status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'on_auth_user_created') 
    THEN '✅ Trigger exists'
    ELSE '❌ Trigger missing'
  END as trigger_status,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'handle_new_user')
    THEN '✅ Function exists'  
    ELSE '❌ Function missing'
  END as function_status;