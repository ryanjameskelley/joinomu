

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."assign_patient_to_provider"("patient_profile_id" "uuid", "provider_profile_id" "uuid", "treatment_type_param" "text" DEFAULT 'general_care'::"text", "is_primary_param" boolean DEFAULT false) RETURNS TABLE("success" boolean, "message" "text", "assignment_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  patient_id_var UUID;
  provider_id_var UUID;
  assignment_id_var UUID;
BEGIN
  -- Get the patient ID from profile ID
  SELECT id INTO patient_id_var
  FROM patients
  WHERE profile_id = patient_profile_id;
  
  IF patient_id_var IS NULL THEN
    RETURN QUERY SELECT false, 'Patient not found', NULL::UUID;
    RETURN;
  END IF;
  
  -- Get the provider ID from profile ID
  SELECT id INTO provider_id_var
  FROM providers
  WHERE profile_id = provider_profile_id AND active = true;
  
  IF provider_id_var IS NULL THEN
    RETURN QUERY SELECT false, 'Provider not found or inactive', NULL::UUID;
    RETURN;
  END IF;
  
  -- Check if assignment already exists
  IF EXISTS (
    SELECT 1 FROM patient_assignments 
    WHERE patient_id = patient_id_var 
    AND provider_id = provider_id_var
    AND treatment_type = treatment_type_param
  ) THEN
    RETURN QUERY SELECT false, 'Patient is already assigned to this provider for this treatment type', NULL::UUID;
    RETURN;
  END IF;
  
  -- Create the assignment
  INSERT INTO patient_assignments (
    patient_id,
    provider_id,
    treatment_type,
    is_primary,
    assigned_date
  ) VALUES (
    patient_id_var,
    provider_id_var,
    treatment_type_param,
    is_primary_param,
    CURRENT_DATE
  ) RETURNING id INTO assignment_id_var;
  
  RETURN QUERY SELECT true, 'Patient successfully assigned to provider', assignment_id_var;
END;
$$;


ALTER FUNCTION "public"."assign_patient_to_provider"("patient_profile_id" "uuid", "provider_profile_id" "uuid", "treatment_type_param" "text", "is_primary_param" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."book_appointment"("p_patient_profile_id" "uuid", "p_provider_id" "uuid", "p_appointment_date" "date", "p_start_time" time without time zone, "p_treatment_type" "text", "p_appointment_type" "text" DEFAULT 'consultation'::"text", "p_booked_by" "text" DEFAULT 'patient'::"text", "p_patient_notes" "text" DEFAULT NULL::"text") RETURNS TABLE("success" boolean, "appointment_id" "uuid", "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_patient_id UUID;
  v_assignment_id UUID;
  v_duration_minutes INTEGER;
  v_end_time TIME;
  v_new_appointment_id UUID;
BEGIN
  -- Get patient ID from profile ID
  SELECT p.id INTO v_patient_id
  FROM patients p
  WHERE p.profile_id = p_patient_profile_id;
  
  IF v_patient_id IS NULL THEN
    success := false;
    appointment_id := NULL;
    message := 'Patient not found';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Verify patient-provider relationship exists
  SELECT pa.id INTO v_assignment_id
  FROM patient_assignments pa
  WHERE pa.patient_id = v_patient_id
    AND pa.provider_id = p_provider_id
    AND pa.active = true
  LIMIT 1;
  
  IF v_assignment_id IS NULL THEN
    success := false;
    appointment_id := NULL;
    message := 'No active assignment between patient and provider';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check if the requested slot is available
  SELECT ps.slot_duration_minutes INTO v_duration_minutes
  FROM provider_schedules ps
  WHERE ps.provider_id = p_provider_id
    AND ps.day_of_week = EXTRACT(DOW FROM p_appointment_date)
    AND ps.start_time <= p_start_time
    AND ps.end_time >= p_start_time + INTERVAL '30 minutes' -- minimum slot
    AND ps.active = true
    AND (p_treatment_type = ANY(ps.treatment_types) OR array_length(ps.treatment_types, 1) IS NULL)
  LIMIT 1;
  
  IF v_duration_minutes IS NULL THEN
    success := false;
    appointment_id := NULL;
    message := 'Provider not available at requested time';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Calculate end time
  v_end_time := p_start_time + INTERVAL '1 minute' * v_duration_minutes;
  
  -- Check for scheduling conflicts
  IF EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.provider_id = p_provider_id
      AND a.appointment_date = p_appointment_date
      AND a.start_time = p_start_time
      AND a.status NOT IN ('cancelled', 'no_show')
  ) THEN
    success := false;
    appointment_id := NULL;
    message := 'Time slot already booked';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check for availability overrides
  IF EXISTS (
    SELECT 1 FROM provider_availability_overrides pao
    WHERE pao.provider_id = p_provider_id
      AND pao.date = p_appointment_date
      AND pao.available = false
      AND (pao.start_time IS NULL OR p_start_time >= pao.start_time)
      AND (pao.end_time IS NULL OR v_end_time <= pao.end_time)
  ) THEN
    success := false;
    appointment_id := NULL;
    message := 'Provider not available on requested date';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Create the appointment
  INSERT INTO appointments (
    patient_id,
    provider_id,
    assignment_id,
    appointment_date,
    start_time,
    end_time,
    duration_minutes,
    treatment_type,
    appointment_type,
    status,
    patient_notes,
    booked_by,
    booked_by_user_id
  ) VALUES (
    v_patient_id,
    p_provider_id,
    v_assignment_id,
    p_appointment_date,
    p_start_time,
    v_end_time,
    v_duration_minutes,
    p_treatment_type,
    p_appointment_type,
    'scheduled',
    p_patient_notes,
    p_booked_by,
    p_patient_profile_id
  ) RETURNING id INTO v_new_appointment_id;
  
  -- Return success
  success := true;
  appointment_id := v_new_appointment_id;
  message := 'Appointment booked successfully';
  RETURN NEXT;
  RETURN;
  
EXCEPTION
  WHEN OTHERS THEN
    success := false;
    appointment_id := NULL;
    message := 'Error booking appointment: ' || SQLERRM;
    RETURN NEXT;
    RETURN;
END;
$$;


ALTER FUNCTION "public"."book_appointment"("p_patient_profile_id" "uuid", "p_provider_id" "uuid", "p_appointment_date" "date", "p_start_time" time without time zone, "p_treatment_type" "text", "p_appointment_type" "text", "p_booked_by" "text", "p_patient_notes" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."book_appointment"("p_patient_profile_id" "uuid", "p_provider_id" "uuid", "p_appointment_date" "date", "p_start_time" time without time zone, "p_treatment_type" "text", "p_appointment_type" "text", "p_booked_by" "text", "p_patient_notes" "text") IS 'Books a new appointment with full validation';



CREATE OR REPLACE FUNCTION "public"."cancel_appointment"("p_appointment_id" "uuid", "p_cancelled_by" "text", "p_cancelled_by_user_id" "uuid", "p_cancellation_reason" "text") RETURNS TABLE("success" boolean, "message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  v_appointment RECORD;
BEGIN
  -- Get appointment details
  SELECT * INTO v_appointment
  FROM appointments
  WHERE id = p_appointment_id;
  
  IF NOT FOUND THEN
    success := false;
    message := 'Appointment not found';
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Check if appointment can be cancelled
  IF v_appointment.status NOT IN ('scheduled', 'confirmed') THEN
    success := false;
    message := 'Appointment cannot be cancelled in current status: ' || v_appointment.status;
    RETURN NEXT;
    RETURN;
  END IF;
  
  -- Update appointment status
  UPDATE appointments
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_cancelled_by,
    cancelled_by_user_id = p_cancelled_by_user_id,
    cancellation_reason = p_cancellation_reason
  WHERE id = p_appointment_id;
  
  success := true;
  message := 'Appointment cancelled successfully';
  RETURN NEXT;
  RETURN;
  
EXCEPTION
  WHEN OTHERS THEN
    success := false;
    message := 'Error cancelling appointment: ' || SQLERRM;
    RETURN NEXT;
    RETURN;
END;
$$;


ALTER FUNCTION "public"."cancel_appointment"("p_appointment_id" "uuid", "p_cancelled_by" "text", "p_cancelled_by_user_id" "uuid", "p_cancellation_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."cancel_appointment"("p_appointment_id" "uuid", "p_cancelled_by" "text", "p_cancelled_by_user_id" "uuid", "p_cancellation_reason" "text") IS 'Cancels an existing appointment with audit trail';



CREATE OR REPLACE FUNCTION "public"."check_auth_trigger_health"() RETURNS TABLE("metric" "text", "value" integer, "status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."check_auth_trigger_health"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_default_provider_schedule"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RAISE LOG 'Provider schedule trigger fired for provider ID: %', NEW.id;
    RAISE NOTICE 'Provider schedule trigger fired for provider ID: %', NEW.id;
    
    -- Add Monday-Friday 9 AM to 5 PM schedule for new provider
    INSERT INTO provider_schedules (provider_id, day_of_week, start_time, end_time, active, created_at) VALUES
    (NEW.id, 1, '09:00:00', '17:00:00', true, now()), -- Monday
    (NEW.id, 2, '09:00:00', '17:00:00', true, now()), -- Tuesday
    (NEW.id, 3, '09:00:00', '17:00:00', true, now()), -- Wednesday
    (NEW.id, 4, '09:00:00', '17:00:00', true, now()), -- Thursday
    (NEW.id, 5, '09:00:00', '17:00:00', true, now()); -- Friday
    
    RAISE LOG 'Created default schedule for provider %', NEW.id;
    RAISE NOTICE 'Created default schedule for provider %', NEW.id;
    
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Log error but don't fail the provider creation
        RAISE LOG 'Error creating default schedule for provider %: %', NEW.id, SQLERRM;
        RAISE NOTICE 'Error creating default schedule for provider %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."create_default_provider_schedule"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_admin_appointment_overview"("p_date_range_start" "date" DEFAULT CURRENT_DATE, "p_date_range_end" "date" DEFAULT (CURRENT_DATE + '7 days'::interval), "p_provider_id" "uuid" DEFAULT NULL::"uuid", "p_patient_id" "uuid" DEFAULT NULL::"uuid") RETURNS TABLE("appointment_id" "uuid", "patient_name" "text", "provider_name" "text", "appointment_date" "date", "start_time" time without time zone, "end_time" time without time zone, "treatment_type" "text", "appointment_type" "text", "status" "text", "last_updated" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as appointment_id,
    (patient_prof.first_name || ' ' || patient_prof.last_name) as patient_name,
    (provider_prof.first_name || ' ' || provider_prof.last_name) as provider_name,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.treatment_type,
    a.appointment_type,
    a.status,
    a.updated_at as last_updated
  FROM appointments a
  INNER JOIN patients p ON a.patient_id = p.id
  INNER JOIN profiles patient_prof ON p.profile_id = patient_prof.id
  INNER JOIN providers prov ON a.provider_id = prov.id
  INNER JOIN profiles provider_prof ON prov.profile_id = provider_prof.id
  WHERE a.appointment_date >= p_date_range_start
    AND a.appointment_date <= p_date_range_end
    AND (p_provider_id IS NULL OR a.provider_id = p_provider_id)
    AND (p_patient_id IS NULL OR a.patient_id = p_patient_id)
  ORDER BY a.appointment_date ASC, a.start_time ASC;
END;
$$;


ALTER FUNCTION "public"."get_admin_appointment_overview"("p_date_range_start" "date", "p_date_range_end" "date", "p_provider_id" "uuid", "p_patient_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_admin_appointment_overview"("p_date_range_start" "date", "p_date_range_end" "date", "p_provider_id" "uuid", "p_patient_id" "uuid") IS 'Admin dashboard view of appointments with filtering';



CREATE OR REPLACE FUNCTION "public"."get_admin_fulfillment_queue"() RETURNS TABLE("order_id" "uuid", "patient_name" "text", "medication_name" "text", "quantity" integer, "total_amount" numeric, "payment_status" "text", "fulfillment_status" "text", "order_date" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mo.id,
    CONCAT(pr.first_name, ' ', pr.last_name),
    m.name,
    mo.quantity,
    mo.total_amount,
    mo.payment_status,
    mo.fulfillment_status,
    mo.created_at
  FROM medication_orders mo
  JOIN medications m ON mo.medication_id = m.id
  JOIN patients pt ON mo.patient_id = pt.id
  JOIN profiles pr ON pt.profile_id = pr.id
  WHERE mo.fulfillment_status IN ('pending', 'processing')
  ORDER BY 
    CASE mo.payment_status 
      WHEN 'paid' THEN 1 
      ELSE 2 
    END,
    mo.created_at ASC;
END;
$$;


ALTER FUNCTION "public"."get_admin_fulfillment_queue"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_all_patients_for_admin"() RETURNS TABLE("patient_id" "uuid", "profile_id" "uuid", "first_name" "text", "last_name" "text", "email" "text", "phone" "text", "date_of_birth" "date", "has_completed_intake" boolean, "assigned_providers" "text"[], "treatment_types" "text"[], "medications" "text"[], "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as patient_id,
    p.profile_id,
    prof.first_name,
    prof.last_name,
    prof.email,
    p.phone,
    p.date_of_birth,
    p.has_completed_intake,
    COALESCE(
      ARRAY_AGG(
        DISTINCT CONCAT(prov_prof.first_name, ' ', prov_prof.last_name)
      ) FILTER (WHERE pa.id IS NOT NULL),
      '{}'::TEXT[]
    ) as assigned_providers,
    COALESCE(
      ARRAY_AGG(DISTINCT pa.treatment_type) FILTER (WHERE pa.treatment_type IS NOT NULL),
      '{}'::TEXT[]
    ) as treatment_types,
    COALESCE(
      ARRAY_AGG(DISTINCT m.name) FILTER (WHERE m.name IS NOT NULL),
      '{}'::TEXT[]
    ) as medications,
    p.created_at
  FROM patients p
  INNER JOIN profiles prof ON p.profile_id = prof.id
  LEFT JOIN patient_assignments pa ON p.profile_id = pa.patient_id
  LEFT JOIN providers prov ON pa.provider_id = prov.id
  LEFT JOIN profiles prov_prof ON prov.profile_id = prov_prof.id
  LEFT JOIN patient_medication_preferences pmp ON p.id = pmp.patient_id
  LEFT JOIN medications m ON pmp.medication_id = m.id
  WHERE prof.role = 'patient'  -- Only include users with patient role
  GROUP BY p.id, p.profile_id, prof.first_name, prof.last_name, prof.email, p.phone, p.date_of_birth, p.has_completed_intake, p.created_at
  ORDER BY prof.first_name, prof.last_name;
END;
$$;


ALTER FUNCTION "public"."get_all_patients_for_admin"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_assigned_patients_for_provider"("provider_profile_id" "uuid") RETURNS TABLE("patient_id" "uuid", "profile_id" "uuid", "first_name" "text", "last_name" "text", "email" "text", "phone" "text", "date_of_birth" "date", "treatment_type" "text", "assigned_date" "date", "is_primary" boolean, "has_completed_intake" boolean, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id as patient_id,
    p.profile_id,
    prof.first_name,
    prof.last_name,
    prof.email,
    p.phone,
    p.date_of_birth,
    pa.treatment_type,
    pa.assigned_date::DATE,
    pa.is_primary,
    p.has_completed_intake,
    p.created_at
  FROM patients p
  INNER JOIN profiles prof ON p.profile_id = prof.id
  INNER JOIN patient_assignments pa ON p.id = pa.patient_id  -- Fixed: was p.profile_id = pa.patient_id
  INNER JOIN providers prov ON pa.provider_id = prov.id
  WHERE prov.profile_id = provider_profile_id
  ORDER BY pa.assigned_date DESC, prof.first_name, prof.last_name;
END;
$$;


ALTER FUNCTION "public"."get_assigned_patients_for_provider"("provider_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_available_slots_for_provider"("p_provider_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_treatment_type" "text" DEFAULT NULL::"text") RETURNS TABLE("slot_date" "date", "slot_start_time" time without time zone, "slot_end_time" time without time zone, "duration_minutes" integer)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  WITH RECURSIVE date_series AS (
    SELECT p_start_date AS date
    UNION ALL
    SELECT date + 1
    FROM date_series
    WHERE date < p_end_date
  ),
  provider_daily_schedule AS (
    SELECT 
      ds.date,
      ps.start_time,
      ps.end_time,
      ps.slot_duration_minutes,
      ps.treatment_types
    FROM date_series ds
    CROSS JOIN provider_schedules ps
    WHERE ps.provider_id = p_provider_id
      AND ps.active = true
      AND ps.day_of_week = EXTRACT(DOW FROM ds.date)
      AND (
        p_treatment_type IS NULL 
        OR array_length(ps.treatment_types, 1) IS NULL 
        OR p_treatment_type = ANY(ps.treatment_types)
      )
  ),
  time_slots AS (
    SELECT 
      pds.date,
      slot_time::TIME AS start_time,
      (slot_time + (pds.slot_duration_minutes || ' minutes')::INTERVAL)::TIME AS end_time,
      pds.slot_duration_minutes
    FROM provider_daily_schedule pds
    CROSS JOIN LATERAL generate_series(
      pds.date + pds.start_time,
      pds.date + pds.end_time - (pds.slot_duration_minutes || ' minutes')::INTERVAL,
      (pds.slot_duration_minutes || ' minutes')::INTERVAL
    ) AS slot_time
  )
  SELECT 
    ts.date AS slot_date,
    ts.start_time AS slot_start_time,
    ts.end_time AS slot_end_time,
    ts.slot_duration_minutes AS duration_minutes
  FROM time_slots ts
  LEFT JOIN appointments a ON (
    a.provider_id = p_provider_id
    AND a.appointment_date = ts.date
    AND a.start_time = ts.start_time
    AND a.status IN ('scheduled', 'confirmed')
    AND (a.is_reschedule_source IS NULL OR a.is_reschedule_source = false)
  )
  WHERE a.id IS NULL  -- Only return slots that don't have existing appointments
  ORDER BY ts.date, ts.start_time;
END;
$$;


ALTER FUNCTION "public"."get_available_slots_for_provider"("p_provider_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_treatment_type" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_available_slots_for_provider"("p_provider_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_treatment_type" "text") IS 'Returns available appointment slots for a provider excluding rescheduled appointments';



CREATE OR REPLACE FUNCTION "public"."get_patient_appointments"("p_patient_profile_id" "uuid", "p_include_past" boolean DEFAULT false) RETURNS TABLE("appointment_id" "uuid", "provider_name" "text", "provider_specialty" "text", "appointment_date" "date", "start_time" time without time zone, "end_time" time without time zone, "treatment_type" "text", "appointment_type" "text", "status" "text", "patient_notes" "text", "provider_notes" "text", "can_cancel" boolean, "can_reschedule" boolean, "created_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id as appointment_id,
    (prof.first_name || ' ' || prof.last_name) as provider_name,
    prov.specialty as provider_specialty,
    a.appointment_date,
    a.start_time,
    a.end_time,
    a.treatment_type,
    a.appointment_type,
    a.status,
    a.patient_notes,
    a.provider_notes,
    -- Can cancel if appointment is scheduled/confirmed and at least 24 hours away
    CASE 
      WHEN a.status IN ('scheduled', 'confirmed') 
        AND (a.appointment_date > CURRENT_DATE + INTERVAL '1 day' 
             OR (a.appointment_date = CURRENT_DATE + INTERVAL '1 day' AND a.start_time > LOCALTIME))
      THEN true
      ELSE false
    END as can_cancel,
    -- Can reschedule if appointment is scheduled/confirmed and at least 48 hours away
    CASE 
      WHEN a.status IN ('scheduled', 'confirmed') 
        AND (a.appointment_date > CURRENT_DATE + INTERVAL '2 days'
             OR (a.appointment_date = CURRENT_DATE + INTERVAL '2 days' AND a.start_time > LOCALTIME))
      THEN true
      ELSE false
    END as can_reschedule,
    a.created_at
  FROM appointments a
  INNER JOIN patients p ON a.patient_id = p.id
  INNER JOIN providers prov ON a.provider_id = prov.id
  INNER JOIN profiles prof ON prov.profile_id = prof.id
  WHERE p.profile_id = p_patient_profile_id
    AND (p_include_past = true OR a.appointment_date >= CURRENT_DATE)
  ORDER BY a.appointment_date ASC, a.start_time ASC;
END;
$$;


ALTER FUNCTION "public"."get_patient_appointments"("p_patient_profile_id" "uuid", "p_include_past" boolean) OWNER TO "postgres";


COMMENT ON FUNCTION "public"."get_patient_appointments"("p_patient_profile_id" "uuid", "p_include_past" boolean) IS 'Gets all appointments for a patient with cancellation/reschedule permissions';



CREATE OR REPLACE FUNCTION "public"."get_patient_medication_overview"("patient_uuid" "uuid") RETURNS TABLE("medication_name" "text", "category" "text", "preference_status" "text", "approval_status" "text", "order_status" "text", "payment_status" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.name,
    m.category,
    pmp.status as preference_status,
    COALESCE(ma.status, 'no_review') as approval_status,
    COALESCE(mo.fulfillment_status, 'no_order') as order_status,
    COALESCE(mo.payment_status, 'no_payment') as payment_status
  FROM patient_medication_preferences pmp
  JOIN medications m ON pmp.medication_id = m.id
  LEFT JOIN medication_approvals ma ON pmp.id = ma.preference_id
  LEFT JOIN medication_orders mo ON ma.id = mo.approval_id
  WHERE pmp.patient_id = patient_uuid
  ORDER BY pmp.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_patient_medication_overview"("patient_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_patient_medications_detailed"("patient_uuid" "uuid") RETURNS TABLE("medication_id" "uuid", "medication_name" "text", "dosage" "text", "supply" "text", "status" "text", "last_payment_date" timestamp with time zone, "sent_to_pharmacy_date" timestamp with time zone, "shipped_date" timestamp with time zone, "tracking_number" "text", "order_id" "uuid")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id as medication_id,
        m.name as medication_name,
        CONCAT(m.strength, ' ', m.dosage_form) as dosage,
        CASE 
            WHEN mo.quantity > 1 THEN CONCAT(mo.quantity::TEXT, ' units')
            ELSE '30 day supply'
        END as supply,
        mo.fulfillment_status as status,
        mo.payment_date as last_payment_date,
        mo.sent_to_pharmacy as sent_to_pharmacy_date,
        mo.shipped_date as shipped_date,
        mo.tracking_number as tracking_number,
        mo.id as order_id
    FROM medication_orders mo
    JOIN medications m ON mo.medication_id = m.id
    JOIN medication_approvals ma ON mo.approval_id = ma.id
    JOIN patient_medication_preferences pmp ON ma.preference_id = pmp.id
    WHERE mo.patient_id = patient_uuid
    AND pmp.status = 'approved'
    AND ma.status = 'approved'
    ORDER BY mo.created_at DESC;
END;
$$;


ALTER FUNCTION "public"."get_patient_medications_detailed"("patient_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_provider_by_profile_id"("provider_profile_id" "uuid") RETURNS TABLE("provider_id" "uuid", "profile_id" "uuid", "first_name" "text", "last_name" "text", "email" "text", "specialty" "text", "license_number" "text", "phone" "text", "active" boolean)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    prov.id as provider_id,
    prov.profile_id,
    prof.first_name,
    prof.last_name,
    prof.email,
    prov.specialty,
    prov.license_number,
    prov.phone,
    prov.active
  FROM providers prov
  INNER JOIN profiles prof ON prov.profile_id = prof.id
  WHERE prov.profile_id = provider_profile_id
  AND prov.active = true;
END;
$$;


ALTER FUNCTION "public"."get_provider_by_profile_id"("provider_profile_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_provider_pending_approvals"("provider_uuid" "uuid") RETURNS TABLE("preference_id" "uuid", "patient_name" "text", "medication_name" "text", "preferred_dosage" "text", "frequency" "text", "patient_notes" "text", "requested_date" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pmp.id,
    CONCAT(pr.first_name, ' ', pr.last_name),
    m.name,
    pmp.preferred_dosage,
    pmp.frequency,
    pmp.notes,
    pmp.requested_date
  FROM patient_medication_preferences pmp
  JOIN medications m ON pmp.medication_id = m.id
  JOIN patients pt ON pmp.patient_id = pt.id
  JOIN profiles pr ON pt.profile_id = pr.id
  JOIN patient_assignments pa ON pt.id = pa.patient_id
  JOIN providers prov ON pa.provider_id = prov.id
  LEFT JOIN medication_approvals ma ON pmp.id = ma.preference_id
  WHERE prov.profile_id = provider_uuid
  AND pmp.status = 'pending'
  AND ma.id IS NULL -- No approval exists yet
  ORDER BY pmp.requested_date ASC;
END;
$$;


ALTER FUNCTION "public"."get_provider_pending_approvals"("provider_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_role"("user_id" "uuid" DEFAULT "auth"."uid"()) RETURNS "text"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = user_id
  );
END;
$$;


ALTER FUNCTION "public"."get_user_role"("user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
DECLARE
    user_role TEXT;
    user_email TEXT;
    first_name TEXT;
    last_name TEXT;
BEGIN
    -- Log that trigger fired
    RAISE NOTICE 'AUTH TRIGGER FIRED for user: %', NEW.id;
    
    -- Extract basic info
    user_email := COALESCE(NEW.email, 'unknown@example.com');
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'patient');
    first_name := COALESCE(NEW.raw_user_meta_data->>'firstName', split_part(user_email, '@', 1));
    last_name := COALESCE(NEW.raw_user_meta_data->>'lastName', '');
    
    RAISE NOTICE 'Creating profile for user % with role %', user_email, user_role;
    
    -- Create profile record
    INSERT INTO public.profiles (
        id, 
        role, 
        email, 
        first_name, 
        last_name,
        created_at,
        updated_at
    ) VALUES (
        NEW.id, 
        user_role, 
        user_email, 
        first_name, 
        last_name,
        NOW(),
        NOW()
    );
    
    RAISE NOTICE 'Profile created successfully';
    
    -- Create role-specific record
    IF user_role = 'patient' THEN
        RAISE NOTICE 'Creating patient record';
        INSERT INTO public.patients (
            id,
            profile_id,
            date_of_birth,
            has_completed_intake,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            '1990-01-01'::DATE,
            false,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Patient record created successfully';
        
    ELSIF user_role = 'provider' THEN
        RAISE NOTICE 'Creating provider record';
        INSERT INTO public.providers (
            id,
            profile_id,
            specialty,
            license_number,
            active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            COALESCE(NEW.raw_user_meta_data->>'specialty', 'General'),
            NEW.raw_user_meta_data->>'licenseNumber',
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Provider record created successfully';
        
    ELSIF user_role = 'admin' THEN
        RAISE NOTICE 'Creating admin record';
        INSERT INTO public.admins (
            id,
            profile_id,
            active,
            created_at,
            updated_at
        ) VALUES (
            gen_random_uuid(),
            NEW.id,
            true,
            NOW(),
            NOW()
        );
        RAISE NOTICE 'Admin record created successfully';
    END IF;
    
    RAISE NOTICE 'AUTH TRIGGER COMPLETED for user: %', NEW.id;
    RETURN NEW;
    
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE 'AUTH TRIGGER ERROR for user %: %', NEW.id, SQLERRM;
    -- Return NEW to not block auth
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


COMMENT ON FUNCTION "public"."handle_new_user"() IS 'Working auth trigger with logging';



CREATE OR REPLACE FUNCTION "public"."log_appointment_changes"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Insert into appointment_history
  INSERT INTO appointment_history (
    appointment_id,
    action,
    performed_by,
    performed_by_user_id,
    old_values,
    new_values,
    reason
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    CASE 
      WHEN TG_OP = 'INSERT' THEN 'created'
      WHEN TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN 'cancelled'
      WHEN TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN 'completed'  
      WHEN TG_OP = 'UPDATE' AND (NEW.appointment_date != OLD.appointment_date OR NEW.start_time != OLD.start_time) THEN 'rescheduled'
      WHEN TG_OP = 'UPDATE' THEN 'updated'
      WHEN TG_OP = 'DELETE' THEN 'deleted'
    END,
    COALESCE(
      current_setting('app.current_user_role', true),
      'system'
    ),
    CASE 
      WHEN current_setting('app.current_user_id', true) != '' 
      THEN current_setting('app.current_user_id', true)::UUID
      ELSE NULL
    END,
    CASE WHEN TG_OP != 'INSERT' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN to_jsonb(NEW) ELSE NULL END,
    CASE 
      WHEN TG_OP = 'UPDATE' AND NEW.status = 'cancelled' THEN NEW.cancellation_reason
      ELSE NULL
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION "public"."log_appointment_changes"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."repair_missing_profiles"() RETURNS TABLE("user_id" "uuid", "action_taken" "text", "success" boolean, "error_message" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION "public"."repair_missing_profiles"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."reschedule_appointment"("p_appointment_id" "uuid", "p_new_date" "date", "p_new_time" time without time zone, "p_rescheduled_by" "text" DEFAULT 'patient'::"text", "p_rescheduled_by_user_id" "uuid" DEFAULT NULL::"uuid", "p_reason" "text" DEFAULT NULL::"text") RETURNS json
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  v_old_appointment appointments%ROWTYPE;
  v_new_appointment_id UUID;
  v_new_end_time TIME;
  v_duration_minutes INTEGER;
  v_result JSON;
BEGIN
  -- Get the original appointment
  SELECT * INTO v_old_appointment 
  FROM appointments 
  WHERE id = p_appointment_id AND status NOT IN ('cancelled', 'completed');
  
  IF NOT FOUND THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Appointment not found or cannot be rescheduled'
    );
  END IF;
  
  -- Check if the new slot is available
  IF EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.provider_id = v_old_appointment.provider_id
      AND a.appointment_date = p_new_date
      AND a.start_time = p_new_time
      AND a.status NOT IN ('cancelled', 'no_show')
      AND a.is_reschedule_source = false
      AND a.id != p_appointment_id
  ) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Selected time slot is already booked'
    );
  END IF;
  
  -- Calculate new end time (preserve original duration)
  v_duration_minutes := v_old_appointment.duration_minutes;
  v_new_end_time := p_new_time + (v_duration_minutes || ' minutes')::INTERVAL;
  
  -- Start transaction
  BEGIN
    -- Mark the original appointment as rescheduled (source)
    UPDATE appointments 
    SET 
      status = 'rescheduled',
      is_reschedule_source = true,
      updated_at = NOW()
    WHERE id = p_appointment_id;
    
    -- Create new appointment with rescheduled data
    INSERT INTO appointments (
      patient_id,
      provider_id,
      assignment_id,
      appointment_date,
      start_time,
      end_time,
      duration_minutes,
      treatment_type,
      appointment_type,
      status,
      patient_notes,
      provider_notes,
      admin_notes,
      booked_by,
      booked_by_user_id,
      rescheduled_from_id,
      reschedule_count
    ) VALUES (
      v_old_appointment.patient_id,
      v_old_appointment.provider_id,
      v_old_appointment.assignment_id,
      p_new_date,
      p_new_time,
      v_new_end_time,
      v_old_appointment.duration_minutes,
      v_old_appointment.treatment_type,
      v_old_appointment.appointment_type,
      'scheduled',
      v_old_appointment.patient_notes,
      v_old_appointment.provider_notes,
      CASE 
        WHEN v_old_appointment.admin_notes IS NULL THEN 'Rescheduled from ' || v_old_appointment.appointment_date || ' ' || v_old_appointment.start_time
        ELSE v_old_appointment.admin_notes || ' | Rescheduled from ' || v_old_appointment.appointment_date || ' ' || v_old_appointment.start_time
      END,
      p_rescheduled_by,
      p_rescheduled_by_user_id,
      p_appointment_id,
      COALESCE(v_old_appointment.reschedule_count, 0) + 1
    ) RETURNING id INTO v_new_appointment_id;
    
    -- Update the old appointment to point to the new one
    UPDATE appointments 
    SET rescheduled_to_id = v_new_appointment_id
    WHERE id = p_appointment_id;
    
    -- Log the reschedule action in history (with proper error handling)
    BEGIN
      INSERT INTO appointment_history (
        appointment_id,
        action,
        performed_by,
        performed_by_user_id,
        old_values,
        new_values,
        reason
      ) VALUES (
        p_appointment_id,
        'rescheduled', -- Use 'rescheduled' instead of 'reschedule'
        p_rescheduled_by,
        p_rescheduled_by_user_id,
        json_build_object(
          'appointment_date', v_old_appointment.appointment_date,
          'start_time', v_old_appointment.start_time,
          'end_time', v_old_appointment.end_time
        ),
        json_build_object(
          'appointment_date', p_new_date,
          'start_time', p_new_time,
          'end_time', v_new_end_time
        ),
        p_reason
      );
    EXCEPTION 
      WHEN undefined_table THEN
        -- History table doesn't exist, continue without logging
        NULL;
      WHEN check_violation THEN
        -- Check constraint violation, try with 'updated' action instead
        INSERT INTO appointment_history (
          appointment_id,
          action,
          performed_by,
          performed_by_user_id,
          old_values,
          new_values,
          reason
        ) VALUES (
          p_appointment_id,
          'updated',
          p_rescheduled_by,
          p_rescheduled_by_user_id,
          json_build_object(
            'appointment_date', v_old_appointment.appointment_date,
            'start_time', v_old_appointment.start_time,
            'end_time', v_old_appointment.end_time
          ),
          json_build_object(
            'appointment_date', p_new_date,
            'start_time', p_new_time,
            'end_time', v_new_end_time
          ),
          COALESCE(p_reason, 'Appointment rescheduled')
        );
      WHEN OTHERS THEN
        -- Other errors, continue without logging
        NULL;
    END;
    
    -- Return success with both appointment IDs
    RETURN json_build_object(
      'success', true,
      'old_appointment_id', p_appointment_id,
      'new_appointment_id', v_new_appointment_id,
      'message', 'Appointment successfully rescheduled'
    );
    
  EXCEPTION WHEN OTHERS THEN
    -- Rollback will happen automatically
    RETURN json_build_object(
      'success', false,
      'error', 'Failed to reschedule appointment: ' || SQLERRM
    );
  END;
END;
$$;


ALTER FUNCTION "public"."reschedule_appointment"("p_appointment_id" "uuid", "p_new_date" "date", "p_new_time" time without time zone, "p_rescheduled_by" "text", "p_rescheduled_by_user_id" "uuid", "p_reason" "text") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."reschedule_appointment"("p_appointment_id" "uuid", "p_new_date" "date", "p_new_time" time without time zone, "p_rescheduled_by" "text", "p_rescheduled_by_user_id" "uuid", "p_reason" "text") IS 'Fixed reschedule function with proper appointment_history constraint handling';



CREATE OR REPLACE FUNCTION "public"."set_appointment_context"("p_user_role" "text", "p_user_id" "uuid") RETURNS "void"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  PERFORM set_config('app.current_user_role', p_user_role, true);
  PERFORM set_config('app.current_user_id', p_user_id::TEXT, true);
END;
$$;


ALTER FUNCTION "public"."set_appointment_context"("p_user_role" "text", "p_user_id" "uuid") OWNER TO "postgres";


COMMENT ON FUNCTION "public"."set_appointment_context"("p_user_role" "text", "p_user_id" "uuid") IS 'Sets security context for appointment operations';



CREATE OR REPLACE FUNCTION "public"."update_clinical_note_editor"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Set last_updated_by to current user if available
  IF current_setting('app.current_user_id', true) != '' THEN
    NEW.last_updated_by = current_setting('app.current_user_id', true)::UUID;
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_clinical_note_editor"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    -- Only update if the table actually has an updated_at column
    IF TG_TABLE_NAME = 'clinical_notes' THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail the operation if there's an issue
        RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."validate_appointment_business_rules"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- Prevent booking conflicts
  IF EXISTS (
    SELECT 1 FROM appointments a
    WHERE a.provider_id = NEW.provider_id
      AND a.appointment_date = NEW.appointment_date
      AND a.start_time = NEW.start_time
      AND a.id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)
      AND a.status NOT IN ('cancelled', 'no_show')
  ) THEN
    RAISE EXCEPTION 'Appointment slot already booked';
  END IF;
  
  -- Validate appointment is within provider's schedule
  IF NOT EXISTS (
    SELECT 1 FROM provider_schedules ps
    WHERE ps.provider_id = NEW.provider_id
      AND ps.day_of_week = EXTRACT(DOW FROM NEW.appointment_date)
      AND ps.start_time <= NEW.start_time
      AND ps.end_time >= NEW.end_time
      AND ps.active = true
  ) THEN
    RAISE EXCEPTION 'Appointment outside provider schedule';
  END IF;
  
  -- Check for availability overrides that block this time
  IF EXISTS (
    SELECT 1 FROM provider_availability_overrides pao
    WHERE pao.provider_id = NEW.provider_id
      AND pao.date = NEW.appointment_date
      AND pao.available = false
      AND (pao.start_time IS NULL OR NEW.start_time >= pao.start_time)
      AND (pao.end_time IS NULL OR NEW.end_time <= pao.end_time)
  ) THEN
    RAISE EXCEPTION 'Provider not available at requested time';
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."validate_appointment_business_rules"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "permissions" "text"[] DEFAULT ARRAY['dashboard'::"text"],
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."appointment_history" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "action" "text" NOT NULL,
    "performed_by" "text" NOT NULL,
    "performed_by_user_id" "uuid",
    "old_values" "jsonb",
    "new_values" "jsonb",
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "appointment_history_action_check" CHECK (("action" = ANY (ARRAY['created'::"text", 'updated'::"text", 'cancelled'::"text", 'completed'::"text", 'no_show'::"text", 'reschedule'::"text", 'rescheduled'::"text"]))),
    CONSTRAINT "appointment_history_performed_by_check" CHECK (("performed_by" = ANY (ARRAY['patient'::"text", 'provider'::"text", 'admin'::"text", 'system'::"text"])))
);


ALTER TABLE "public"."appointment_history" OWNER TO "postgres";


COMMENT ON TABLE "public"."appointment_history" IS 'Complete audit trail of all appointment changes';



CREATE TABLE IF NOT EXISTS "public"."appointments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "assignment_id" "uuid",
    "appointment_date" "date" NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "duration_minutes" integer NOT NULL,
    "treatment_type" "text" NOT NULL,
    "appointment_type" "text" DEFAULT 'consultation'::"text" NOT NULL,
    "status" "text" DEFAULT 'scheduled'::"text" NOT NULL,
    "patient_notes" "text",
    "provider_notes" "text",
    "admin_notes" "text",
    "booked_by" "text" NOT NULL,
    "booked_by_user_id" "uuid",
    "booking_timestamp" timestamp with time zone DEFAULT "now"(),
    "cancelled_at" timestamp with time zone,
    "cancelled_by" "text",
    "cancelled_by_user_id" "uuid",
    "cancellation_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "rescheduled_from_id" "uuid",
    "rescheduled_to_id" "uuid",
    "is_reschedule_source" boolean DEFAULT false,
    "reschedule_count" integer DEFAULT 0,
    CONSTRAINT "appointment_in_future" CHECK ((("appointment_date" > CURRENT_DATE) OR (("appointment_date" = CURRENT_DATE) AND ("start_time" >= LOCALTIME)))),
    CONSTRAINT "appointments_appointment_type_check" CHECK (("appointment_type" = ANY (ARRAY['consultation'::"text", 'follow_up'::"text", 'treatment'::"text", 'evaluation'::"text", 'review'::"text"]))),
    CONSTRAINT "appointments_booked_by_check" CHECK (("booked_by" = ANY (ARRAY['patient'::"text", 'provider'::"text", 'admin'::"text"]))),
    CONSTRAINT "appointments_cancelled_by_check" CHECK (("cancelled_by" = ANY (ARRAY['patient'::"text", 'provider'::"text", 'admin'::"text"]))),
    CONSTRAINT "appointments_duration_minutes_check" CHECK (("duration_minutes" > 0)),
    CONSTRAINT "appointments_status_check" CHECK (("status" = ANY (ARRAY['scheduled'::"text", 'confirmed'::"text", 'completed'::"text", 'cancelled'::"text", 'no_show'::"text", 'rescheduled'::"text"]))),
    CONSTRAINT "valid_appointment_time" CHECK (("end_time" > "start_time")),
    CONSTRAINT "valid_cancellation" CHECK ((("status" <> 'cancelled'::"text") OR (("status" = 'cancelled'::"text") AND ("cancelled_at" IS NOT NULL) AND ("cancelled_by" IS NOT NULL))))
);


ALTER TABLE "public"."appointments" OWNER TO "postgres";


COMMENT ON TABLE "public"."appointments" IS 'Core appointments between patients and providers';



COMMENT ON COLUMN "public"."appointments"."assignment_id" IS 'Links appointment to specific patient-provider treatment assignment';



COMMENT ON COLUMN "public"."appointments"."booked_by_user_id" IS 'Profile ID of the person who booked the appointment';



COMMENT ON COLUMN "public"."appointments"."rescheduled_from_id" IS 'Points to original appointment if this is a rescheduled appointment';



COMMENT ON COLUMN "public"."appointments"."rescheduled_to_id" IS 'Points to new appointment if this was rescheduled';



COMMENT ON COLUMN "public"."appointments"."is_reschedule_source" IS 'True if this appointment was rescheduled (original slot now available)';



COMMENT ON COLUMN "public"."appointments"."reschedule_count" IS 'Number of times this appointment chain has been rescheduled';



CREATE TABLE IF NOT EXISTS "public"."assignment_log" (
    "id" integer NOT NULL,
    "message" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."assignment_log" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."assignment_log_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."assignment_log_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."assignment_log_id_seq" OWNED BY "public"."assignment_log"."id";



CREATE TABLE IF NOT EXISTS "public"."auth_trigger_debug_log" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "step" "text",
    "status" "text",
    "error_message" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_trigger_debug_log" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."auth_trigger_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid",
    "trigger_stage" "text" NOT NULL,
    "success" boolean NOT NULL,
    "error_message" "text",
    "metadata" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."auth_trigger_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."clinical_notes" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "allergies" "text"[] DEFAULT '{}'::"text"[],
    "previous_medications" "text"[] DEFAULT '{}'::"text"[],
    "current_medications" "text"[] DEFAULT '{}'::"text"[],
    "clinical_note" "text" DEFAULT ''::"text",
    "internal_note" "text" DEFAULT ''::"text",
    "visit_summary" "text" DEFAULT ''::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid",
    "last_updated_by" "uuid"
);


ALTER TABLE "public"."clinical_notes" OWNER TO "postgres";


COMMENT ON TABLE "public"."clinical_notes" IS 'Clinical notes and medical information recorded during patient visits';



COMMENT ON COLUMN "public"."clinical_notes"."appointment_id" IS 'Links clinical note to specific appointment';



COMMENT ON COLUMN "public"."clinical_notes"."allergies" IS 'Array of patient allergies recorded during visit';



COMMENT ON COLUMN "public"."clinical_notes"."previous_medications" IS 'Array of previous medications mentioned during visit';



COMMENT ON COLUMN "public"."clinical_notes"."current_medications" IS 'Array of current medications mentioned during visit';



COMMENT ON COLUMN "public"."clinical_notes"."clinical_note" IS 'Main clinical observations and notes';



COMMENT ON COLUMN "public"."clinical_notes"."internal_note" IS 'Internal provider notes, not visible to patients';



COMMENT ON COLUMN "public"."clinical_notes"."visit_summary" IS 'Auto-generated or custom summary of the visit';



CREATE TABLE IF NOT EXISTS "public"."medication_approvals" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "preference_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "status" "text" DEFAULT 'needs_review'::"text" NOT NULL,
    "approved_dosage" "text",
    "approved_frequency" "text",
    "provider_notes" "text",
    "contraindications" "text",
    "approval_date" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "check_approval_status" CHECK (("status" = ANY (ARRAY['approved'::"text", 'denied'::"text", 'needs_review'::"text"])))
);


ALTER TABLE "public"."medication_approvals" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."medication_dosages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "medication_id" "uuid" NOT NULL,
    "strength" "text" NOT NULL,
    "unit_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "available" boolean DEFAULT true,
    "sort_order" integer DEFAULT 0,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."medication_dosages" OWNER TO "postgres";


COMMENT ON TABLE "public"."medication_dosages" IS 'Stores multiple dosage options for each medication. Replaces the single strength field in medications table.';



CREATE TABLE IF NOT EXISTS "public"."medication_orders" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "approval_id" "uuid" NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "medication_id" "uuid" NOT NULL,
    "quantity" integer DEFAULT 1 NOT NULL,
    "unit_price" numeric(10,2) NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "payment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "payment_method" "text",
    "payment_date" timestamp with time zone,
    "fulfillment_status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "tracking_number" "text",
    "shipped_date" timestamp with time zone,
    "estimated_delivery" timestamp with time zone,
    "admin_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "sent_to_pharmacy" timestamp with time zone,
    CONSTRAINT "check_fulfillment_status" CHECK (("fulfillment_status" = ANY (ARRAY['pending'::"text", 'processing'::"text", 'shipped'::"text", 'delivered'::"text"]))),
    CONSTRAINT "check_payment_status" CHECK (("payment_status" = ANY (ARRAY['pending'::"text", 'paid'::"text", 'failed'::"text", 'refunded'::"text"]))),
    CONSTRAINT "check_positive_amounts" CHECK ((("unit_price" >= (0)::numeric) AND ("total_amount" >= (0)::numeric) AND ("quantity" > 0)))
);


ALTER TABLE "public"."medication_orders" OWNER TO "postgres";


COMMENT ON COLUMN "public"."medication_orders"."shipped_date" IS 'Date when medication was physically shipped to patient';



COMMENT ON COLUMN "public"."medication_orders"."sent_to_pharmacy" IS 'Date when prescription was sent to pharmacy for processing';



CREATE TABLE IF NOT EXISTS "public"."medications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "generic_name" "text",
    "brand_name" "text",
    "dosage_form" "text" NOT NULL,
    "strength" "text" NOT NULL,
    "description" "text",
    "category" "text" NOT NULL,
    "unit_price" numeric(10,2) DEFAULT 0 NOT NULL,
    "requires_prescription" boolean DEFAULT true,
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."medications" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_assignments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "treatment_type" "text" DEFAULT 'general_care'::"text",
    "is_primary" boolean DEFAULT false,
    "assigned_date" timestamp with time zone DEFAULT "now"(),
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patient_assignments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_medication_preferences" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid" NOT NULL,
    "medication_id" "uuid" NOT NULL,
    "preferred_dosage" "text",
    "frequency" "text",
    "notes" "text",
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "requested_date" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "medication_dosage_id" "uuid",
    CONSTRAINT "check_preference_status" CHECK (("status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'denied'::"text", 'discontinued'::"text"])))
);


ALTER TABLE "public"."patient_medication_preferences" OWNER TO "postgres";


COMMENT ON COLUMN "public"."patient_medication_preferences"."medication_dosage_id" IS 'References the specific dosage selected by the patient. New preferred method over preferred_dosage text field.';



CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "date_of_birth" "date",
    "phone" "text",
    "has_completed_intake" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "profiles_role_check" CHECK (("role" = ANY (ARRAY['patient'::"text", 'admin'::"text", 'provider'::"text"])))
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."provider_availability_overrides" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "date" "date" NOT NULL,
    "start_time" time without time zone,
    "end_time" time without time zone,
    "available" boolean NOT NULL,
    "reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "valid_override_time" CHECK ((("available" = false) OR (("available" = true) AND ("start_time" IS NOT NULL) AND ("end_time" IS NOT NULL) AND ("end_time" > "start_time"))))
);


ALTER TABLE "public"."provider_availability_overrides" OWNER TO "postgres";


COMMENT ON TABLE "public"."provider_availability_overrides" IS 'Date-specific availability changes (vacations, special hours, etc.)';



COMMENT ON COLUMN "public"."provider_availability_overrides"."available" IS 'false=unavailable, true=special availability override';



CREATE TABLE IF NOT EXISTS "public"."provider_schedules" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "slot_duration_minutes" integer DEFAULT 30 NOT NULL,
    "treatment_types" "text"[] DEFAULT '{}'::"text"[],
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "provider_schedules_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6))),
    CONSTRAINT "provider_schedules_slot_duration_minutes_check" CHECK (("slot_duration_minutes" > 0)),
    CONSTRAINT "valid_time_range" CHECK (("end_time" > "start_time"))
);


ALTER TABLE "public"."provider_schedules" OWNER TO "postgres";


COMMENT ON TABLE "public"."provider_schedules" IS 'Recurring weekly availability schedules for providers';



COMMENT ON COLUMN "public"."provider_schedules"."day_of_week" IS '0=Sunday, 1=Monday, ..., 6=Saturday';



COMMENT ON COLUMN "public"."provider_schedules"."treatment_types" IS 'Empty array means available for all treatment types';



CREATE TABLE IF NOT EXISTS "public"."providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "profile_id" "uuid" NOT NULL,
    "specialty" "text",
    "license_number" "text",
    "phone" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."providers" OWNER TO "postgres";


CREATE OR REPLACE VIEW "public"."provider_availability_summary" AS
 SELECT "p"."id" AS "provider_id",
    (("prof"."first_name" || ' '::"text") || "prof"."last_name") AS "provider_name",
    "ps"."day_of_week",
        CASE "ps"."day_of_week"
            WHEN 0 THEN 'Sunday'::"text"
            WHEN 1 THEN 'Monday'::"text"
            WHEN 2 THEN 'Tuesday'::"text"
            WHEN 3 THEN 'Wednesday'::"text"
            WHEN 4 THEN 'Thursday'::"text"
            WHEN 5 THEN 'Friday'::"text"
            WHEN 6 THEN 'Saturday'::"text"
            ELSE NULL::"text"
        END AS "day_name",
    "ps"."start_time",
    "ps"."end_time",
    "ps"."slot_duration_minutes",
    "ps"."treatment_types",
    "ps"."active"
   FROM (("public"."providers" "p"
     JOIN "public"."profiles" "prof" ON (("p"."profile_id" = "prof"."id")))
     JOIN "public"."provider_schedules" "ps" ON (("p"."id" = "ps"."provider_id")))
  ORDER BY "p"."id", "ps"."day_of_week", "ps"."start_time";


ALTER VIEW "public"."provider_availability_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."provider_availability_summary" IS 'Easy view of all provider schedules with readable day names';



CREATE OR REPLACE VIEW "public"."upcoming_appointments_summary" AS
 SELECT "a"."id" AS "appointment_id",
    (("patient_prof"."first_name" || ' '::"text") || "patient_prof"."last_name") AS "patient_name",
    (("provider_prof"."first_name" || ' '::"text") || "provider_prof"."last_name") AS "provider_name",
    "a"."appointment_date",
    "a"."start_time",
    "a"."end_time",
    "a"."treatment_type",
    "a"."appointment_type",
    "a"."status",
    "a"."created_at"
   FROM (((("public"."appointments" "a"
     JOIN "public"."patients" "p" ON (("a"."patient_id" = "p"."id")))
     JOIN "public"."profiles" "patient_prof" ON (("p"."profile_id" = "patient_prof"."id")))
     JOIN "public"."providers" "prov" ON (("a"."provider_id" = "prov"."id")))
     JOIN "public"."profiles" "provider_prof" ON (("prov"."profile_id" = "provider_prof"."id")))
  WHERE ("a"."appointment_date" >= CURRENT_DATE)
  ORDER BY "a"."appointment_date", "a"."start_time";


ALTER VIEW "public"."upcoming_appointments_summary" OWNER TO "postgres";


COMMENT ON VIEW "public"."upcoming_appointments_summary" IS 'Overview of all upcoming appointments with patient and provider names';



CREATE TABLE IF NOT EXISTS "public"."visit_addendums" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "visit_id" "uuid" NOT NULL,
    "provider_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "visit_addendums_content_not_empty" CHECK (("length"(TRIM(BOTH FROM "content")) > 0))
);


ALTER TABLE "public"."visit_addendums" OWNER TO "postgres";


COMMENT ON TABLE "public"."visit_addendums" IS 'Addendums to previous visits for additional notes or corrections';



COMMENT ON COLUMN "public"."visit_addendums"."visit_id" IS 'Links addendum to specific appointment/visit';



COMMENT ON COLUMN "public"."visit_addendums"."provider_id" IS 'Provider who created the addendum';



COMMENT ON COLUMN "public"."visit_addendums"."content" IS 'Content of the addendum';



COMMENT ON COLUMN "public"."visit_addendums"."created_at" IS 'When the addendum was created';



CREATE TABLE IF NOT EXISTS "public"."visit_interactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinical_note_id" "uuid" NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "interaction_type" "text" NOT NULL,
    "details" "text",
    "provider_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "performed_by" "uuid" NOT NULL,
    "medication_id" "uuid",
    "medication_name" "text",
    "previous_dosage" "text",
    "new_dosage" "text",
    "previous_frequency" "text",
    "new_frequency" "text",
    "previous_status" "text",
    "new_status" "text",
    CONSTRAINT "visit_interactions_interaction_type_check" CHECK (("interaction_type" = ANY (ARRAY['treatment_plan_update'::"text", 'follow_up_scheduled'::"text", 'referral_made'::"text", 'lab_ordered'::"text", 'allergy_noted'::"text", 'vital_signs_recorded'::"text"]))),
    CONSTRAINT "visit_interactions_new_status_check" CHECK ((("new_status" IS NULL) OR ("new_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'denied'::"text", 'discontinued'::"text"]))))
);


ALTER TABLE "public"."visit_interactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."visit_interactions" IS 'General interactions and activities during visits (non-medication)';



COMMENT ON COLUMN "public"."visit_interactions"."interaction_type" IS 'Type of interaction: treatment_plan_update, follow_up_scheduled, etc.';



COMMENT ON COLUMN "public"."visit_interactions"."details" IS 'General details about the interaction';



CREATE TABLE IF NOT EXISTS "public"."visit_medication_adjustments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "clinical_note_id" "uuid" NOT NULL,
    "appointment_id" "uuid" NOT NULL,
    "preference_id" "uuid" NOT NULL,
    "previous_dosage" "text",
    "previous_frequency" "text",
    "previous_status" "text",
    "previous_provider_notes" "text",
    "new_dosage" "text",
    "new_frequency" "text",
    "new_status" "text",
    "new_provider_notes" "text",
    "adjustment_reason" "text",
    "provider_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "performed_by" "uuid" NOT NULL,
    CONSTRAINT "visit_medication_adjustments_new_status_check" CHECK (("new_status" = ANY (ARRAY['pending'::"text", 'approved'::"text", 'denied'::"text", 'discontinued'::"text"])))
);


ALTER TABLE "public"."visit_medication_adjustments" OWNER TO "postgres";


COMMENT ON TABLE "public"."visit_medication_adjustments" IS 'Medication adjustments made during visits, links to patient_medication_preferences';



COMMENT ON COLUMN "public"."visit_medication_adjustments"."preference_id" IS 'Links to existing patient_medication_preferences table';



COMMENT ON COLUMN "public"."visit_medication_adjustments"."adjustment_reason" IS 'Reason for the medication adjustment';



ALTER TABLE ONLY "public"."assignment_log" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."assignment_log_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."appointment_history"
    ADD CONSTRAINT "appointment_history_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."assignment_log"
    ADD CONSTRAINT "assignment_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_trigger_debug_log"
    ADD CONSTRAINT "auth_trigger_debug_log_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."auth_trigger_logs"
    ADD CONSTRAINT "auth_trigger_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."clinical_notes"
    ADD CONSTRAINT "clinical_notes_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medication_approvals"
    ADD CONSTRAINT "medication_approvals_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medication_dosages"
    ADD CONSTRAINT "medication_dosages_medication_id_strength_key" UNIQUE ("medication_id", "strength");



ALTER TABLE ONLY "public"."medication_dosages"
    ADD CONSTRAINT "medication_dosages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medication_orders"
    ADD CONSTRAINT "medication_orders_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."medications"
    ADD CONSTRAINT "medications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_assignments"
    ADD CONSTRAINT "patient_assignments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_medication_preferences"
    ADD CONSTRAINT "patient_medication_preferences_patient_id_medication_id_key" UNIQUE ("patient_id", "medication_id");



ALTER TABLE ONLY "public"."patient_medication_preferences"
    ADD CONSTRAINT "patient_medication_preferences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_availability_overrides"
    ADD CONSTRAINT "provider_availability_overrides_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."provider_schedules"
    ADD CONSTRAINT "provider_schedules_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_profile_id_key" UNIQUE ("profile_id");



ALTER TABLE ONLY "public"."clinical_notes"
    ADD CONSTRAINT "unique_appointment_clinical_note" UNIQUE ("appointment_id");



ALTER TABLE ONLY "public"."clinical_notes"
    ADD CONSTRAINT "unique_clinical_note_per_appointment" UNIQUE ("appointment_id");



ALTER TABLE ONLY "public"."patient_assignments"
    ADD CONSTRAINT "unique_primary_assignment" EXCLUDE USING "btree" ("patient_id" WITH =) WHERE ((("is_primary" = true) AND ("active" = true)));



ALTER TABLE ONLY "public"."provider_availability_overrides"
    ADD CONSTRAINT "unique_provider_override" UNIQUE ("provider_id", "date", "start_time", "end_time");



ALTER TABLE ONLY "public"."provider_schedules"
    ADD CONSTRAINT "unique_provider_schedule" UNIQUE ("provider_id", "day_of_week", "start_time", "end_time");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "unique_provider_slot" UNIQUE ("provider_id", "appointment_date", "start_time");



ALTER TABLE ONLY "public"."visit_addendums"
    ADD CONSTRAINT "visit_addendums_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visit_interactions"
    ADD CONSTRAINT "visit_interactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."visit_medication_adjustments"
    ADD CONSTRAINT "visit_medication_adjustments_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_admins_profile_id" ON "public"."admins" USING "btree" ("profile_id");



CREATE INDEX "idx_appointment_history_appointment" ON "public"."appointment_history" USING "btree" ("appointment_id");



CREATE INDEX "idx_appointment_history_created" ON "public"."appointment_history" USING "btree" ("created_at");



CREATE INDEX "idx_appointments_assignment" ON "public"."appointments" USING "btree" ("assignment_id");



CREATE INDEX "idx_appointments_date_range" ON "public"."appointments" USING "btree" ("appointment_date");



CREATE INDEX "idx_appointments_patient_id" ON "public"."appointments" USING "btree" ("patient_id");



CREATE INDEX "idx_appointments_provider_date" ON "public"."appointments" USING "btree" ("provider_id", "appointment_date");



CREATE INDEX "idx_appointments_provider_id" ON "public"."appointments" USING "btree" ("provider_id");



CREATE INDEX "idx_appointments_reschedule_source" ON "public"."appointments" USING "btree" ("is_reschedule_source");



CREATE INDEX "idx_appointments_rescheduled_from" ON "public"."appointments" USING "btree" ("rescheduled_from_id");



CREATE INDEX "idx_appointments_rescheduled_to" ON "public"."appointments" USING "btree" ("rescheduled_to_id");



CREATE INDEX "idx_appointments_status" ON "public"."appointments" USING "btree" ("status");



CREATE INDEX "idx_clinical_notes_appointment" ON "public"."clinical_notes" USING "btree" ("appointment_id");



CREATE INDEX "idx_clinical_notes_appointment_id" ON "public"."clinical_notes" USING "btree" ("appointment_id");



CREATE INDEX "idx_clinical_notes_created_at" ON "public"."clinical_notes" USING "btree" ("created_at");



CREATE INDEX "idx_clinical_notes_patient" ON "public"."clinical_notes" USING "btree" ("patient_id");



CREATE INDEX "idx_clinical_notes_patient_id" ON "public"."clinical_notes" USING "btree" ("patient_id");



CREATE INDEX "idx_clinical_notes_provider" ON "public"."clinical_notes" USING "btree" ("provider_id");



CREATE INDEX "idx_clinical_notes_provider_id" ON "public"."clinical_notes" USING "btree" ("provider_id");



CREATE INDEX "idx_clinical_notes_updated_at" ON "public"."clinical_notes" USING "btree" ("updated_at");



CREATE INDEX "idx_medication_approvals_provider_id" ON "public"."medication_approvals" USING "btree" ("provider_id");



CREATE INDEX "idx_medication_approvals_status" ON "public"."medication_approvals" USING "btree" ("status");



CREATE INDEX "idx_medication_dosages_available" ON "public"."medication_dosages" USING "btree" ("available");



CREATE INDEX "idx_medication_dosages_medication_id" ON "public"."medication_dosages" USING "btree" ("medication_id");



CREATE INDEX "idx_medication_dosages_sort_order" ON "public"."medication_dosages" USING "btree" ("sort_order");



CREATE INDEX "idx_medication_orders_fulfillment_status" ON "public"."medication_orders" USING "btree" ("fulfillment_status");



CREATE INDEX "idx_medication_orders_patient_created" ON "public"."medication_orders" USING "btree" ("patient_id", "created_at" DESC);



CREATE INDEX "idx_medication_orders_patient_id" ON "public"."medication_orders" USING "btree" ("patient_id");



CREATE INDEX "idx_medication_orders_payment_status" ON "public"."medication_orders" USING "btree" ("payment_status");



CREATE INDEX "idx_medication_orders_sent_to_pharmacy" ON "public"."medication_orders" USING "btree" ("sent_to_pharmacy");



CREATE INDEX "idx_medications_active" ON "public"."medications" USING "btree" ("active");



CREATE INDEX "idx_medications_category" ON "public"."medications" USING "btree" ("category");



CREATE INDEX "idx_patient_assignments_active" ON "public"."patient_assignments" USING "btree" ("active");



CREATE INDEX "idx_patient_assignments_patient_id" ON "public"."patient_assignments" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_assignments_provider_id" ON "public"."patient_assignments" USING "btree" ("provider_id");



CREATE INDEX "idx_patient_medication_preferences_patient_id" ON "public"."patient_medication_preferences" USING "btree" ("patient_id");



CREATE INDEX "idx_patient_medication_preferences_status" ON "public"."patient_medication_preferences" USING "btree" ("status");



CREATE INDEX "idx_patients_profile_id" ON "public"."patients" USING "btree" ("profile_id");



CREATE INDEX "idx_profiles_email" ON "public"."profiles" USING "btree" ("email");



CREATE INDEX "idx_profiles_role" ON "public"."profiles" USING "btree" ("role");



CREATE INDEX "idx_provider_overrides_date_range" ON "public"."provider_availability_overrides" USING "btree" ("date");



CREATE INDEX "idx_provider_overrides_provider_date" ON "public"."provider_availability_overrides" USING "btree" ("provider_id", "date");



CREATE INDEX "idx_provider_schedules_day_active" ON "public"."provider_schedules" USING "btree" ("day_of_week", "active");



CREATE INDEX "idx_provider_schedules_provider_id" ON "public"."provider_schedules" USING "btree" ("provider_id");



CREATE INDEX "idx_providers_profile_id" ON "public"."providers" USING "btree" ("profile_id");



CREATE INDEX "idx_visit_addendums_created_at" ON "public"."visit_addendums" USING "btree" ("created_at");



CREATE INDEX "idx_visit_addendums_provider_id" ON "public"."visit_addendums" USING "btree" ("provider_id");



CREATE INDEX "idx_visit_addendums_visit_id" ON "public"."visit_addendums" USING "btree" ("visit_id");



CREATE INDEX "idx_visit_interactions_appointment" ON "public"."visit_interactions" USING "btree" ("appointment_id");



CREATE INDEX "idx_visit_interactions_appointment_id" ON "public"."visit_interactions" USING "btree" ("appointment_id");



CREATE INDEX "idx_visit_interactions_clinical_note" ON "public"."visit_interactions" USING "btree" ("clinical_note_id");



CREATE INDEX "idx_visit_interactions_clinical_note_id" ON "public"."visit_interactions" USING "btree" ("clinical_note_id");



CREATE INDEX "idx_visit_interactions_created_at" ON "public"."visit_interactions" USING "btree" ("created_at");



CREATE INDEX "idx_visit_interactions_medication_id" ON "public"."visit_interactions" USING "btree" ("medication_id");



CREATE INDEX "idx_visit_interactions_type" ON "public"."visit_interactions" USING "btree" ("interaction_type");



CREATE INDEX "idx_visit_medication_adjustments_appointment" ON "public"."visit_medication_adjustments" USING "btree" ("appointment_id");



CREATE INDEX "idx_visit_medication_adjustments_clinical_note" ON "public"."visit_medication_adjustments" USING "btree" ("clinical_note_id");



CREATE INDEX "idx_visit_medication_adjustments_created_at" ON "public"."visit_medication_adjustments" USING "btree" ("created_at");



CREATE INDEX "idx_visit_medication_adjustments_preference" ON "public"."visit_medication_adjustments" USING "btree" ("preference_id");



CREATE OR REPLACE TRIGGER "appointment_audit_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."log_appointment_changes"();



CREATE OR REPLACE TRIGGER "appointment_business_rules_trigger" BEFORE INSERT OR UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."validate_appointment_business_rules"();



CREATE OR REPLACE TRIGGER "on_provider_created" AFTER INSERT ON "public"."providers" FOR EACH ROW EXECUTE FUNCTION "public"."create_default_provider_schedule"();



CREATE OR REPLACE TRIGGER "update_admins_updated_at" BEFORE UPDATE ON "public"."admins" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_appointments_updated_at" BEFORE UPDATE ON "public"."appointments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_clinical_note_editor_trigger" BEFORE UPDATE ON "public"."clinical_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_clinical_note_editor"();



CREATE OR REPLACE TRIGGER "update_clinical_notes_updated_at" BEFORE UPDATE ON "public"."clinical_notes" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_medication_approvals_updated_at" BEFORE UPDATE ON "public"."medication_approvals" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_medication_dosages_updated_at" BEFORE UPDATE ON "public"."medication_dosages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_medication_orders_updated_at" BEFORE UPDATE ON "public"."medication_orders" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_medications_updated_at" BEFORE UPDATE ON "public"."medications" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_patient_assignments_updated_at" BEFORE UPDATE ON "public"."patient_assignments" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_patient_medication_preferences_updated_at" BEFORE UPDATE ON "public"."patient_medication_preferences" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_patients_updated_at" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_profiles_updated_at" BEFORE UPDATE ON "public"."profiles" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_provider_schedules_updated_at" BEFORE UPDATE ON "public"."provider_schedules" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_providers_updated_at" BEFORE UPDATE ON "public"."providers" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointment_history"
    ADD CONSTRAINT "appointment_history_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "public"."patient_assignments"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_rescheduled_from_id_fkey" FOREIGN KEY ("rescheduled_from_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."appointments"
    ADD CONSTRAINT "appointments_rescheduled_to_id_fkey" FOREIGN KEY ("rescheduled_to_id") REFERENCES "public"."appointments"("id");



ALTER TABLE ONLY "public"."auth_trigger_logs"
    ADD CONSTRAINT "auth_trigger_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id");



ALTER TABLE ONLY "public"."clinical_notes"
    ADD CONSTRAINT "clinical_notes_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_notes"
    ADD CONSTRAINT "clinical_notes_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."clinical_notes"
    ADD CONSTRAINT "clinical_notes_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medication_approvals"
    ADD CONSTRAINT "medication_approvals_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "public"."patient_medication_preferences"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medication_approvals"
    ADD CONSTRAINT "medication_approvals_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medication_dosages"
    ADD CONSTRAINT "medication_dosages_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medication_orders"
    ADD CONSTRAINT "medication_orders_approval_id_fkey" FOREIGN KEY ("approval_id") REFERENCES "public"."medication_approvals"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medication_orders"
    ADD CONSTRAINT "medication_orders_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."medication_orders"
    ADD CONSTRAINT "medication_orders_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_assignments"
    ADD CONSTRAINT "patient_assignments_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_assignments"
    ADD CONSTRAINT "patient_assignments_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_medication_preferences"
    ADD CONSTRAINT "patient_medication_preferences_medication_dosage_id_fkey" FOREIGN KEY ("medication_dosage_id") REFERENCES "public"."medication_dosages"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."patient_medication_preferences"
    ADD CONSTRAINT "patient_medication_preferences_medication_id_fkey" FOREIGN KEY ("medication_id") REFERENCES "public"."medications"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_medication_preferences"
    ADD CONSTRAINT "patient_medication_preferences_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_availability_overrides"
    ADD CONSTRAINT "provider_availability_overrides_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."provider_schedules"
    ADD CONSTRAINT "provider_schedules_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_addendums"
    ADD CONSTRAINT "visit_addendums_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_addendums"
    ADD CONSTRAINT "visit_addendums_visit_id_fkey" FOREIGN KEY ("visit_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_interactions"
    ADD CONSTRAINT "visit_interactions_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_interactions"
    ADD CONSTRAINT "visit_interactions_clinical_note_id_fkey" FOREIGN KEY ("clinical_note_id") REFERENCES "public"."clinical_notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_medication_adjustments"
    ADD CONSTRAINT "visit_medication_adjustments_appointment_id_fkey" FOREIGN KEY ("appointment_id") REFERENCES "public"."appointments"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_medication_adjustments"
    ADD CONSTRAINT "visit_medication_adjustments_clinical_note_id_fkey" FOREIGN KEY ("clinical_note_id") REFERENCES "public"."clinical_notes"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."visit_medication_adjustments"
    ADD CONSTRAINT "visit_medication_adjustments_preference_id_fkey" FOREIGN KEY ("preference_id") REFERENCES "public"."patient_medication_preferences"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all assignments" ON "public"."patient_assignments" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."profile_id" = "auth"."uid"()) AND ("admins"."active" = true)))));



CREATE POLICY "Admins can manage all medication orders" ON "public"."medication_orders" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Admins can manage all medications" ON "public"."medications" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Admins can manage all patients" ON "public"."patients" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."profile_id" = "auth"."uid"()) AND ("admins"."active" = true)))));



CREATE POLICY "Admins can manage all providers" ON "public"."providers" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."profile_id" = "auth"."uid"()) AND ("admins"."active" = true)))));



CREATE POLICY "Admins can update own data" ON "public"."admins" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Admins can view all clinical notes" ON "public"."clinical_notes" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all medication approvals" ON "public"."medication_approvals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all medication preferences" ON "public"."patient_medication_preferences" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all profiles" ON "public"."profiles" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE (("admins"."profile_id" = "auth"."uid"()) AND ("admins"."active" = true)))));



CREATE POLICY "Admins can view all visit addendums" ON "public"."visit_addendums" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view all visit interactions" ON "public"."visit_interactions" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"text")))));



CREATE POLICY "Admins can view own data" ON "public"."admins" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Allow admins to read logs" ON "public"."auth_trigger_logs" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."role" = 'admin'::"text")))));



CREATE POLICY "Allow auth trigger and service role" ON "public"."profiles" USING (true);



CREATE POLICY "Allow auth trigger and service role" ON "public"."provider_schedules" USING (true);



CREATE POLICY "Allow auth trigger and service role" ON "public"."providers" USING (true);



CREATE POLICY "Allow trigger function to write logs" ON "public"."auth_trigger_logs" FOR INSERT WITH CHECK (true);



CREATE POLICY "Anyone can view active medications" ON "public"."medications" FOR SELECT USING (("active" = true));



CREATE POLICY "Patients can manage own medication preferences" ON "public"."patient_medication_preferences" USING ((EXISTS ( SELECT 1
   FROM "public"."patients"
  WHERE (("patients"."profile_id" = "auth"."uid"()) AND ("patients"."id" = "patient_medication_preferences"."patient_id")))));



CREATE POLICY "Patients can update own data" ON "public"."patients" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own assignments" ON "public"."patient_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patients"
  WHERE (("patients"."id" = "patient_assignments"."patient_id") AND ("patients"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Patients can view own data" ON "public"."patients" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Patients can view own medication approvals" ON "public"."medication_approvals" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."patients" "pt"
     JOIN "public"."patient_medication_preferences" "pmp" ON (("pt"."id" = "pmp"."patient_id")))
  WHERE (("pt"."profile_id" = "auth"."uid"()) AND ("pmp"."id" = "medication_approvals"."preference_id")))));



CREATE POLICY "Patients can view own medication orders" ON "public"."medication_orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patients"
  WHERE (("patients"."profile_id" = "auth"."uid"()) AND ("patients"."id" = "medication_orders"."patient_id")))));



CREATE POLICY "Patients can view their clinical notes" ON "public"."clinical_notes" FOR SELECT TO "authenticated" USING (("patient_id" IN ( SELECT "p"."id"
   FROM ("public"."patients" "p"
     JOIN "public"."profiles" "pr" ON (("p"."profile_id" = "pr"."id")))
  WHERE ("pr"."id" = "auth"."uid"()))));



CREATE POLICY "Patients can view their own clinical notes" ON "public"."clinical_notes" FOR SELECT USING (("patient_id" IN ( SELECT "p"."id"
   FROM "public"."patients" "p"
  WHERE ("p"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Patients can view their own visit interactions" ON "public"."visit_interactions" FOR SELECT USING (("appointment_id" IN ( SELECT "a"."id"
   FROM ("public"."appointments" "a"
     JOIN "public"."patients" "p" ON (("a"."patient_id" = "p"."id")))
  WHERE ("p"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Patients can view their visit addendums" ON "public"."visit_addendums" FOR SELECT TO "authenticated" USING (("visit_id" IN ( SELECT "a"."id"
   FROM (("public"."appointments" "a"
     JOIN "public"."patients" "p" ON (("a"."patient_id" = "p"."id")))
     JOIN "public"."profiles" "pr" ON (("p"."profile_id" = "pr"."id")))
  WHERE ("pr"."id" = "auth"."uid"()))));



CREATE POLICY "Patients can view their visit interactions" ON "public"."visit_interactions" FOR SELECT TO "authenticated" USING (("appointment_id" IN ( SELECT "a"."id"
   FROM (("public"."appointments" "a"
     JOIN "public"."patients" "p" ON (("a"."patient_id" = "p"."id")))
     JOIN "public"."profiles" "pr" ON (("p"."profile_id" = "pr"."id")))
  WHERE ("pr"."id" = "auth"."uid"()))));



CREATE POLICY "Providers can create clinical notes for their patients" ON "public"."clinical_notes" FOR INSERT WITH CHECK (("provider_id" IN ( SELECT "p"."id"
   FROM "public"."providers" "p"
  WHERE ("p"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Providers can create orders for assigned patients" ON "public"."medication_orders" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM ("public"."patient_assignments" "pa"
     JOIN "public"."providers" "p" ON (("pa"."provider_id" = "p"."id")))
  WHERE (("p"."profile_id" = "auth"."uid"()) AND ("pa"."patient_id" = "medication_orders"."patient_id")))));



CREATE POLICY "Providers can create visit interactions for their appointments" ON "public"."visit_interactions" FOR INSERT WITH CHECK (("appointment_id" IN ( SELECT "a"."id"
   FROM ("public"."appointments" "a"
     JOIN "public"."providers" "p" ON (("a"."provider_id" = "p"."id")))
  WHERE ("p"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Providers can manage addendums for their patients" ON "public"."visit_addendums" TO "authenticated" USING (("provider_id" IN ( SELECT "p"."id"
   FROM ("public"."providers" "p"
     JOIN "public"."profiles" "pr" ON (("p"."profile_id" = "pr"."id")))
  WHERE ("pr"."id" = "auth"."uid"()))));



CREATE POLICY "Providers can manage approvals for assigned patients" ON "public"."medication_approvals" USING ((EXISTS ( SELECT 1
   FROM (("public"."providers" "p"
     JOIN "public"."patient_assignments" "pa" ON (("p"."id" = "pa"."provider_id")))
     JOIN "public"."patient_medication_preferences" "pmp" ON (("pa"."patient_id" = "pmp"."patient_id")))
  WHERE (("p"."profile_id" = "auth"."uid"()) AND ("pmp"."id" = "medication_approvals"."preference_id")))));



CREATE POLICY "Providers can manage clinical notes for their patients" ON "public"."clinical_notes" TO "authenticated" USING (("provider_id" IN ( SELECT "p"."id"
   FROM ("public"."providers" "p"
     JOIN "public"."profiles" "pr" ON (("p"."profile_id" = "pr"."id")))
  WHERE ("pr"."id" = "auth"."uid"()))));



CREATE POLICY "Providers can manage visit interactions for their patients" ON "public"."visit_interactions" TO "authenticated" USING (("appointment_id" IN ( SELECT "a"."id"
   FROM (("public"."appointments" "a"
     JOIN "public"."providers" "p" ON (("a"."provider_id" = "p"."id")))
     JOIN "public"."profiles" "pr" ON (("p"."profile_id" = "pr"."id")))
  WHERE ("pr"."id" = "auth"."uid"()))));



CREATE POLICY "Providers can update assigned patient orders" ON "public"."medication_orders" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."patient_assignments" "pa"
     JOIN "public"."providers" "p" ON (("pa"."provider_id" = "p"."id")))
  WHERE (("p"."profile_id" = "auth"."uid"()) AND ("pa"."patient_id" = "medication_orders"."patient_id")))));



CREATE POLICY "Providers can update assigned patient preferences" ON "public"."patient_medication_preferences" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM ("public"."patient_assignments" "pa"
     JOIN "public"."providers" "p" ON (("pa"."provider_id" = "p"."id")))
  WHERE (("p"."profile_id" = "auth"."uid"()) AND ("pa"."patient_id" = "patient_medication_preferences"."patient_id")))));



CREATE POLICY "Providers can update own data" ON "public"."providers" FOR UPDATE USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Providers can update their own clinical notes" ON "public"."clinical_notes" FOR UPDATE USING (("provider_id" IN ( SELECT "p"."id"
   FROM "public"."providers" "p"
  WHERE ("p"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Providers can view assigned patient orders" ON "public"."medication_orders" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."patient_assignments" "pa"
     JOIN "public"."providers" "p" ON (("pa"."provider_id" = "p"."id")))
  WHERE (("p"."profile_id" = "auth"."uid"()) AND ("pa"."patient_id" = "medication_orders"."patient_id")))));



CREATE POLICY "Providers can view assigned patient preferences" ON "public"."patient_medication_preferences" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."patient_assignments" "pa"
     JOIN "public"."providers" "p" ON (("pa"."provider_id" = "p"."id")))
  WHERE (("p"."profile_id" = "auth"."uid"()) AND ("pa"."patient_id" = "patient_medication_preferences"."patient_id")))));



CREATE POLICY "Providers can view assigned patients" ON "public"."patients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."patient_assignments" "pa"
     JOIN "public"."providers" "p" ON (("p"."id" = "pa"."provider_id")))
  WHERE (("p"."profile_id" = "auth"."uid"()) AND ("pa"."patient_id" = "patients"."id") AND ("pa"."active" = true)))));



CREATE POLICY "Providers can view own data" ON "public"."providers" FOR SELECT USING (("profile_id" = "auth"."uid"()));



CREATE POLICY "Providers can view their assignments" ON "public"."patient_assignments" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."providers"
  WHERE (("providers"."id" = "patient_assignments"."provider_id") AND ("providers"."profile_id" = "auth"."uid"())))));



CREATE POLICY "Providers can view their own clinical notes" ON "public"."clinical_notes" FOR SELECT USING (("provider_id" IN ( SELECT "p"."id"
   FROM "public"."providers" "p"
  WHERE ("p"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Providers can view their own visit interactions" ON "public"."visit_interactions" FOR SELECT USING (("appointment_id" IN ( SELECT "a"."id"
   FROM ("public"."appointments" "a"
     JOIN "public"."providers" "p" ON (("a"."provider_id" = "p"."id")))
  WHERE ("p"."profile_id" = "auth"."uid"()))));



CREATE POLICY "Users can update own profile" ON "public"."profiles" FOR UPDATE USING (("auth"."uid"() = "id"));



CREATE POLICY "Users can view own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));



CREATE POLICY "admin_full_appointments_access" ON "public"."appointments" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE (("a"."profile_id" = "auth"."uid"()) AND ("a"."active" = true)))));



COMMENT ON POLICY "admin_full_appointments_access" ON "public"."appointments" IS 'Admins have full access to all appointment data';



CREATE POLICY "admin_view_all_appointment_history" ON "public"."appointment_history" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE (("a"."profile_id" = "auth"."uid"()) AND ("a"."active" = true)))));



CREATE POLICY "admin_view_all_overrides" ON "public"."provider_availability_overrides" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE (("a"."profile_id" = "auth"."uid"()) AND ("a"."active" = true)))));



CREATE POLICY "admin_view_all_schedules" ON "public"."provider_schedules" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "a"
  WHERE (("a"."profile_id" = "auth"."uid"()) AND ("a"."active" = true)))));



CREATE POLICY "appointment_history_readonly" ON "public"."appointment_history" FOR INSERT WITH CHECK (false);



COMMENT ON POLICY "appointment_history_readonly" ON "public"."appointment_history" IS 'History is maintained by system triggers only';



ALTER TABLE "public"."auth_trigger_logs" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."clinical_notes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medication_approvals" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medication_orders" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."medications" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_booking_restrictions" ON "public"."appointments" FOR INSERT WITH CHECK ((("patient_id" IN ( SELECT "p"."id"
   FROM "public"."patients" "p"
  WHERE ("p"."profile_id" = "auth"."uid"()))) AND ("provider_id" IN ( SELECT "pa"."provider_id"
   FROM ("public"."patient_assignments" "pa"
     JOIN "public"."patients" "p" ON (("pa"."patient_id" = "p"."id")))
  WHERE (("p"."profile_id" = "auth"."uid"()) AND ("pa"."active" = true)))) AND (("appointment_date" > CURRENT_DATE) OR (("appointment_date" = CURRENT_DATE) AND ("start_time" > LOCALTIME))) AND ("appointment_date" <= (CURRENT_DATE + '90 days'::interval)) AND ("booked_by" = 'patient'::"text")));



COMMENT ON POLICY "patient_booking_restrictions" ON "public"."appointments" IS 'Enforces business rules for patient appointment booking';



ALTER TABLE "public"."patient_medication_preferences" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "patient_no_delete_appointments" ON "public"."appointments" FOR DELETE USING (false);



CREATE POLICY "patient_own_appointments" ON "public"."appointments" USING (("patient_id" IN ( SELECT "p"."id"
   FROM "public"."patients" "p"
  WHERE ("p"."profile_id" = "auth"."uid"()))));



COMMENT ON POLICY "patient_own_appointments" ON "public"."appointments" IS 'Patients can only access their own appointments';



CREATE POLICY "patient_view_own_appointment_history" ON "public"."appointment_history" FOR SELECT USING (("appointment_id" IN ( SELECT "a"."id"
   FROM ("public"."appointments" "a"
     JOIN "public"."patients" "p" ON (("a"."patient_id" = "p"."id")))
  WHERE ("p"."profile_id" = "auth"."uid"()))));



CREATE POLICY "patient_view_provider_overrides" ON "public"."provider_availability_overrides" FOR SELECT USING (("provider_id" IN ( SELECT "pa"."provider_id"
   FROM ("public"."patient_assignments" "pa"
     JOIN "public"."patients" "p" ON (("pa"."patient_id" = "p"."id")))
  WHERE (("p"."profile_id" = "auth"."uid"()) AND ("pa"."active" = true)))));



CREATE POLICY "patient_view_provider_schedules" ON "public"."provider_schedules" FOR SELECT USING (("provider_id" IN ( SELECT "pa"."provider_id"
   FROM ("public"."patient_assignments" "pa"
     JOIN "public"."patients" "p" ON (("pa"."patient_id" = "p"."id")))
  WHERE (("p"."profile_id" = "auth"."uid"()) AND ("pa"."active" = true)))));



ALTER TABLE "public"."provider_availability_overrides" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "provider_no_delete_appointments" ON "public"."appointments" FOR DELETE USING (false);



CREATE POLICY "provider_own_appointments" ON "public"."appointments" USING (("provider_id" IN ( SELECT "pr"."id"
   FROM "public"."providers" "pr"
  WHERE ("pr"."profile_id" = "auth"."uid"()))));



COMMENT ON POLICY "provider_own_appointments" ON "public"."appointments" IS 'Providers can manage appointments with their patients';



CREATE POLICY "provider_own_overrides_policy" ON "public"."provider_availability_overrides" USING (("provider_id" IN ( SELECT "pr"."id"
   FROM "public"."providers" "pr"
  WHERE ("pr"."profile_id" = "auth"."uid"()))));



CREATE POLICY "provider_own_schedule_policy" ON "public"."provider_schedules" USING (("provider_id" IN ( SELECT "pr"."id"
   FROM "public"."providers" "pr"
  WHERE ("pr"."profile_id" = "auth"."uid"()))));



CREATE POLICY "provider_view_appointment_history" ON "public"."appointment_history" FOR SELECT USING (("appointment_id" IN ( SELECT "a"."id"
   FROM ("public"."appointments" "a"
     JOIN "public"."providers" "pr" ON (("a"."provider_id" = "pr"."id")))
  WHERE ("pr"."profile_id" = "auth"."uid"()))));



ALTER TABLE "public"."visit_addendums" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."visit_interactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
GRANT USAGE ON SCHEMA "public" TO "supabase_auth_admin";































































































































































GRANT ALL ON FUNCTION "public"."assign_patient_to_provider"("patient_profile_id" "uuid", "provider_profile_id" "uuid", "treatment_type_param" "text", "is_primary_param" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."assign_patient_to_provider"("patient_profile_id" "uuid", "provider_profile_id" "uuid", "treatment_type_param" "text", "is_primary_param" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_patient_to_provider"("patient_profile_id" "uuid", "provider_profile_id" "uuid", "treatment_type_param" "text", "is_primary_param" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."book_appointment"("p_patient_profile_id" "uuid", "p_provider_id" "uuid", "p_appointment_date" "date", "p_start_time" time without time zone, "p_treatment_type" "text", "p_appointment_type" "text", "p_booked_by" "text", "p_patient_notes" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."book_appointment"("p_patient_profile_id" "uuid", "p_provider_id" "uuid", "p_appointment_date" "date", "p_start_time" time without time zone, "p_treatment_type" "text", "p_appointment_type" "text", "p_booked_by" "text", "p_patient_notes" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."book_appointment"("p_patient_profile_id" "uuid", "p_provider_id" "uuid", "p_appointment_date" "date", "p_start_time" time without time zone, "p_treatment_type" "text", "p_appointment_type" "text", "p_booked_by" "text", "p_patient_notes" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."cancel_appointment"("p_appointment_id" "uuid", "p_cancelled_by" "text", "p_cancelled_by_user_id" "uuid", "p_cancellation_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."cancel_appointment"("p_appointment_id" "uuid", "p_cancelled_by" "text", "p_cancelled_by_user_id" "uuid", "p_cancellation_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."cancel_appointment"("p_appointment_id" "uuid", "p_cancelled_by" "text", "p_cancelled_by_user_id" "uuid", "p_cancellation_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."check_auth_trigger_health"() TO "anon";
GRANT ALL ON FUNCTION "public"."check_auth_trigger_health"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_auth_trigger_health"() TO "service_role";



GRANT ALL ON FUNCTION "public"."create_default_provider_schedule"() TO "anon";
GRANT ALL ON FUNCTION "public"."create_default_provider_schedule"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_default_provider_schedule"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_appointment_overview"("p_date_range_start" "date", "p_date_range_end" "date", "p_provider_id" "uuid", "p_patient_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_appointment_overview"("p_date_range_start" "date", "p_date_range_end" "date", "p_provider_id" "uuid", "p_patient_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_appointment_overview"("p_date_range_start" "date", "p_date_range_end" "date", "p_provider_id" "uuid", "p_patient_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_admin_fulfillment_queue"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_admin_fulfillment_queue"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_admin_fulfillment_queue"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_all_patients_for_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."get_all_patients_for_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_all_patients_for_admin"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_assigned_patients_for_provider"("provider_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_assigned_patients_for_provider"("provider_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_assigned_patients_for_provider"("provider_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_available_slots_for_provider"("p_provider_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_treatment_type" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."get_available_slots_for_provider"("p_provider_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_treatment_type" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_available_slots_for_provider"("p_provider_id" "uuid", "p_start_date" "date", "p_end_date" "date", "p_treatment_type" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_patient_appointments"("p_patient_profile_id" "uuid", "p_include_past" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."get_patient_appointments"("p_patient_profile_id" "uuid", "p_include_past" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_patient_appointments"("p_patient_profile_id" "uuid", "p_include_past" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."get_patient_medication_overview"("patient_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_patient_medication_overview"("patient_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_patient_medication_overview"("patient_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_patient_medications_detailed"("patient_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_patient_medications_detailed"("patient_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_patient_medications_detailed"("patient_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_provider_by_profile_id"("provider_profile_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_provider_by_profile_id"("provider_profile_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_provider_by_profile_id"("provider_profile_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_provider_pending_approvals"("provider_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_provider_pending_approvals"("provider_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_provider_pending_approvals"("provider_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_role"("user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "supabase_auth_admin";



GRANT ALL ON FUNCTION "public"."log_appointment_changes"() TO "anon";
GRANT ALL ON FUNCTION "public"."log_appointment_changes"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."log_appointment_changes"() TO "service_role";



GRANT ALL ON FUNCTION "public"."repair_missing_profiles"() TO "anon";
GRANT ALL ON FUNCTION "public"."repair_missing_profiles"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."repair_missing_profiles"() TO "service_role";



GRANT ALL ON FUNCTION "public"."reschedule_appointment"("p_appointment_id" "uuid", "p_new_date" "date", "p_new_time" time without time zone, "p_rescheduled_by" "text", "p_rescheduled_by_user_id" "uuid", "p_reason" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."reschedule_appointment"("p_appointment_id" "uuid", "p_new_date" "date", "p_new_time" time without time zone, "p_rescheduled_by" "text", "p_rescheduled_by_user_id" "uuid", "p_reason" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."reschedule_appointment"("p_appointment_id" "uuid", "p_new_date" "date", "p_new_time" time without time zone, "p_rescheduled_by" "text", "p_rescheduled_by_user_id" "uuid", "p_reason" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."set_appointment_context"("p_user_role" "text", "p_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."set_appointment_context"("p_user_role" "text", "p_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_appointment_context"("p_user_role" "text", "p_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_clinical_note_editor"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_clinical_note_editor"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_clinical_note_editor"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."validate_appointment_business_rules"() TO "anon";
GRANT ALL ON FUNCTION "public"."validate_appointment_business_rules"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."validate_appointment_business_rules"() TO "service_role";


















GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";
GRANT ALL ON TABLE "public"."admins" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."appointment_history" TO "anon";
GRANT ALL ON TABLE "public"."appointment_history" TO "authenticated";
GRANT ALL ON TABLE "public"."appointment_history" TO "service_role";
GRANT ALL ON TABLE "public"."appointment_history" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."appointments" TO "anon";
GRANT ALL ON TABLE "public"."appointments" TO "authenticated";
GRANT ALL ON TABLE "public"."appointments" TO "service_role";
GRANT ALL ON TABLE "public"."appointments" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."assignment_log" TO "anon";
GRANT ALL ON TABLE "public"."assignment_log" TO "authenticated";
GRANT ALL ON TABLE "public"."assignment_log" TO "service_role";
GRANT ALL ON TABLE "public"."assignment_log" TO "supabase_auth_admin";



GRANT ALL ON SEQUENCE "public"."assignment_log_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."assignment_log_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."assignment_log_id_seq" TO "service_role";
GRANT ALL ON SEQUENCE "public"."assignment_log_id_seq" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."auth_trigger_debug_log" TO "anon";
GRANT ALL ON TABLE "public"."auth_trigger_debug_log" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_trigger_debug_log" TO "service_role";
GRANT ALL ON TABLE "public"."auth_trigger_debug_log" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."auth_trigger_logs" TO "anon";
GRANT ALL ON TABLE "public"."auth_trigger_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."auth_trigger_logs" TO "service_role";
GRANT ALL ON TABLE "public"."auth_trigger_logs" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."clinical_notes" TO "anon";
GRANT ALL ON TABLE "public"."clinical_notes" TO "authenticated";
GRANT ALL ON TABLE "public"."clinical_notes" TO "service_role";
GRANT ALL ON TABLE "public"."clinical_notes" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."medication_approvals" TO "anon";
GRANT ALL ON TABLE "public"."medication_approvals" TO "authenticated";
GRANT ALL ON TABLE "public"."medication_approvals" TO "service_role";
GRANT ALL ON TABLE "public"."medication_approvals" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."medication_dosages" TO "anon";
GRANT ALL ON TABLE "public"."medication_dosages" TO "authenticated";
GRANT ALL ON TABLE "public"."medication_dosages" TO "service_role";
GRANT ALL ON TABLE "public"."medication_dosages" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."medication_orders" TO "anon";
GRANT ALL ON TABLE "public"."medication_orders" TO "authenticated";
GRANT ALL ON TABLE "public"."medication_orders" TO "service_role";
GRANT ALL ON TABLE "public"."medication_orders" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."medications" TO "anon";
GRANT ALL ON TABLE "public"."medications" TO "authenticated";
GRANT ALL ON TABLE "public"."medications" TO "service_role";
GRANT ALL ON TABLE "public"."medications" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."patient_assignments" TO "anon";
GRANT ALL ON TABLE "public"."patient_assignments" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_assignments" TO "service_role";
GRANT ALL ON TABLE "public"."patient_assignments" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."patient_medication_preferences" TO "anon";
GRANT ALL ON TABLE "public"."patient_medication_preferences" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_medication_preferences" TO "service_role";
GRANT ALL ON TABLE "public"."patient_medication_preferences" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";
GRANT ALL ON TABLE "public"."patients" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";
GRANT ALL ON TABLE "public"."profiles" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."provider_availability_overrides" TO "anon";
GRANT ALL ON TABLE "public"."provider_availability_overrides" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_availability_overrides" TO "service_role";
GRANT ALL ON TABLE "public"."provider_availability_overrides" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."provider_schedules" TO "anon";
GRANT ALL ON TABLE "public"."provider_schedules" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_schedules" TO "service_role";
GRANT ALL ON TABLE "public"."provider_schedules" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."providers" TO "anon";
GRANT ALL ON TABLE "public"."providers" TO "authenticated";
GRANT ALL ON TABLE "public"."providers" TO "service_role";
GRANT ALL ON TABLE "public"."providers" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."provider_availability_summary" TO "anon";
GRANT ALL ON TABLE "public"."provider_availability_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."provider_availability_summary" TO "service_role";
GRANT ALL ON TABLE "public"."provider_availability_summary" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."upcoming_appointments_summary" TO "anon";
GRANT ALL ON TABLE "public"."upcoming_appointments_summary" TO "authenticated";
GRANT ALL ON TABLE "public"."upcoming_appointments_summary" TO "service_role";
GRANT ALL ON TABLE "public"."upcoming_appointments_summary" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."visit_addendums" TO "anon";
GRANT ALL ON TABLE "public"."visit_addendums" TO "authenticated";
GRANT ALL ON TABLE "public"."visit_addendums" TO "service_role";
GRANT ALL ON TABLE "public"."visit_addendums" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."visit_interactions" TO "anon";
GRANT ALL ON TABLE "public"."visit_interactions" TO "authenticated";
GRANT ALL ON TABLE "public"."visit_interactions" TO "service_role";
GRANT ALL ON TABLE "public"."visit_interactions" TO "supabase_auth_admin";



GRANT ALL ON TABLE "public"."visit_medication_adjustments" TO "anon";
GRANT ALL ON TABLE "public"."visit_medication_adjustments" TO "authenticated";
GRANT ALL ON TABLE "public"."visit_medication_adjustments" TO "service_role";
GRANT ALL ON TABLE "public"."visit_medication_adjustments" TO "supabase_auth_admin";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























RESET ALL;
