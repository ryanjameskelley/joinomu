-- Fix auth trigger to handle specialty arrays properly

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    first_name_val TEXT;
    last_name_val TEXT;
    phone_val TEXT;
    specialty_val TEXT;
    specialties_array TEXT[];
    treatment_types_array TEXT[];
    license_number_val TEXT;
    new_provider_id UUID;
    schedule_count INTEGER := 0;
    existing_schedules INTEGER := 0;
    profile_created BOOLEAN := FALSE;
    provider_created BOOLEAN := FALSE;
    schedules_created BOOLEAN := FALSE;
    specialty_item TEXT;
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
        split_part(NEW.email, '@', 1)
    );
    
    last_name_val := COALESCE(
        NEW.raw_user_meta_data->>'lastName',
        NEW.raw_user_meta_data->>'last_name',
        NEW.raw_user_meta_data->>'lastname',
        'User'
    );
    
    phone_val := NEW.raw_user_meta_data->>'phone';
    license_number_val := COALESCE(
        NEW.raw_user_meta_data->>'licenseNumber',
        NEW.raw_user_meta_data->>'license_number'
    );
    
    -- Handle specialty as either string or array
    IF NEW.raw_user_meta_data ? 'specialty' THEN
        -- Check if specialty is an array
        IF jsonb_typeof(NEW.raw_user_meta_data->'specialty') = 'array' THEN
            -- Parse JSON array of specialties
            SELECT array_agg(value::text)
            INTO specialties_array
            FROM jsonb_array_elements_text(NEW.raw_user_meta_data->'specialty');
        ELSE
            -- Single specialty string
            specialty_val := NEW.raw_user_meta_data->>'specialty';
            specialties_array := ARRAY[specialty_val];
        END IF;
    ELSE
        -- Default if no specialty provided
        specialties_array := ARRAY['general'];
    END IF;
    
    -- Convert specialties to treatment types
    treatment_types_array := ARRAY[]::TEXT[];
    FOREACH specialty_item IN ARRAY specialties_array LOOP
        CASE 
            WHEN specialty_item = 'weight_loss' OR specialty_item ILIKE '%weight%' OR specialty_item ILIKE '%loss%' THEN
                treatment_types_array := array_append(treatment_types_array, 'weight_loss');
            WHEN specialty_item = 'mens_health' OR specialty_item ILIKE '%men%' OR specialty_item ILIKE '%male%' THEN
                treatment_types_array := array_append(treatment_types_array, 'mens_health');
            WHEN specialty_item = 'therapy' OR specialty_item ILIKE '%therapy%' OR specialty_item ILIKE '%mental%' THEN
                treatment_types_array := array_append(treatment_types_array, 'therapy');
            ELSE
                -- For unknown specialties, use general
                treatment_types_array := array_append(treatment_types_array, 'general');
        END CASE;
    END LOOP;
    
    -- Remove duplicates
    SELECT array_agg(DISTINCT elem) INTO treatment_types_array 
    FROM unnest(treatment_types_array) AS elem;

    -- Log extracted data
    INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
    VALUES (NEW.id, 'DATA_EXTRACTED', true, jsonb_build_object(
        'role', user_role,
        'first_name', first_name_val,
        'last_name', last_name_val,
        'specialties', specialties_array,
        'treatment_types', treatment_types_array,
        'has_phone', phone_val IS NOT NULL
    ));

    -- Create profile
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
            'sql_state', SQLSTATE
        ));
    END;

    -- Handle role-specific records
    IF user_role = 'provider' AND profile_created THEN
        BEGIN
            -- Create provider record with first specialty as primary
            INSERT INTO public.providers (profile_id, specialty, license_number, phone, active, created_at)
            VALUES (
                NEW.id, 
                specialties_array[1], 
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
                'specialty', specialties_array[1],
                'treatment_types', treatment_types_array
            ));
            
            -- Check if schedules already exist
            SELECT COUNT(*) INTO existing_schedules 
            FROM public.provider_schedules 
            WHERE provider_id = new_provider_id;
            
            IF existing_schedules = 0 THEN
                -- Create default schedules with treatment types
                BEGIN
                    FOR day_num IN 1..5 LOOP
                        IF NOT EXISTS (
                            SELECT 1 FROM public.provider_schedules 
                            WHERE provider_id = new_provider_id 
                            AND day_of_week = day_num
                        ) THEN
                            INSERT INTO public.provider_schedules (
                                provider_id, day_of_week, start_time, end_time, 
                                treatment_types, active, created_at
                            ) VALUES (
                                new_provider_id, day_num, '09:00:00'::TIME, '17:00:00'::TIME, 
                                treatment_types_array, true, NOW()
                            );
                            schedule_count := schedule_count + 1;
                        END IF;
                    END LOOP;
                    
                    schedules_created := (schedule_count >= 5);
                    
                    INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, metadata)
                    VALUES (NEW.id, 'SCHEDULES_CREATED', schedules_created, jsonb_build_object(
                        'schedule_count', schedule_count,
                        'provider_id', new_provider_id,
                        'treatment_types', treatment_types_array
                    ));
                    
                EXCEPTION WHEN OTHERS THEN
                    INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, error_message, metadata)
                    VALUES (NEW.id, 'SCHEDULES_CREATE_FAILED', false, SQLERRM, jsonb_build_object(
                        'provider_id', new_provider_id,
                        'sql_state', SQLSTATE,
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
                'sql_state', SQLSTATE
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
        'treatment_types', treatment_types_array,
        'final_role', user_role
    ));

    RETURN NEW;

EXCEPTION WHEN OTHERS THEN
    INSERT INTO public.auth_trigger_logs (user_id, trigger_stage, success, error_message, metadata)
    VALUES (NEW.id, 'TRIGGER_FATAL_ERROR', false, SQLERRM, jsonb_build_object(
        'sql_state', SQLSTATE,
        'error_context', 'Ultimate exception handler'
    ));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;