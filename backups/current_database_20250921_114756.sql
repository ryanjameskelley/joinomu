

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


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."assign_patient_to_provider"("patient_uuid" "uuid", "provider_uuid" "uuid", "treatment_type_param" "text" DEFAULT 'general_care'::"text", "is_primary_param" boolean DEFAULT false) RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  result JSON;
  assignment_id UUID;
BEGIN
  -- Check if user is an admin
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Only admins can assign patients to providers'
    );
  END IF;
  
  -- Check if patient exists
  IF NOT EXISTS (SELECT 1 FROM patients WHERE id = patient_uuid) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Patient not found'
    );
  END IF;
  
  -- Check if provider exists
  IF NOT EXISTS (SELECT 1 FROM providers WHERE id = provider_uuid) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Provider not found'
    );
  END IF;
  
  -- Create assignment
  INSERT INTO patient_providers (id, patient_id, provider_id, treatment_type, is_primary, assigned_date)
  VALUES (gen_random_uuid(), patient_uuid, provider_uuid, treatment_type_param, is_primary_param, NOW())
  RETURNING id INTO assignment_id;
  
  RETURN json_build_object(
    'success', true,
    'assignment_id', assignment_id,
    'message', 'Patient successfully assigned to provider'
  );
END;
$$;


ALTER FUNCTION "public"."assign_patient_to_provider"("patient_uuid" "uuid", "provider_uuid" "uuid", "treatment_type_param" "text", "is_primary_param" boolean) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_admin_record"("user_id_param" "uuid", "email_param" "text", "first_name_param" "text" DEFAULT 'Admin'::"text", "last_name_param" "text" DEFAULT 'User'::"text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  new_id UUID;
  result JSON;
BEGIN
  new_id := gen_random_uuid();
  
  BEGIN
    INSERT INTO admins (id, user_id, email, first_name, last_name, role, permissions, active, created_at, updated_at)
    VALUES (
      new_id,
      user_id_param,
      email_param,
      first_name_param,
      last_name_param,
      'admin',
      ARRAY['messages', 'patients', 'dashboard'],
      true,
      NOW(),
      NOW()
    );
    
    RETURN json_build_object(
      'success', true,
      'admin_id', new_id,
      'message', 'Admin record created successfully'
    );
    
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(
        'success', false,
        'error', SQLERRM,
        'error_code', SQLSTATE
      );
  END;
END;
$$;


ALTER FUNCTION "public"."create_admin_record"("user_id_param" "uuid", "email_param" "text", "first_name_param" "text", "last_name_param" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."debug_table_info"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  result TEXT;
BEGIN
  -- Just return a simple status for now
  result := 'Tables checked successfully at ' || NOW()::TEXT;
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."debug_table_info"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_roles"("user_uuid" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  roles_array TEXT[] := '{}'::TEXT[];
  primary_role TEXT := NULL;
  result JSON;
BEGIN
  -- Check if user is a patient
  IF EXISTS (SELECT 1 FROM patients WHERE user_id = user_uuid) THEN
    roles_array := array_append(roles_array, 'patient');
    IF primary_role IS NULL THEN
      primary_role := 'patient';
    END IF;
  END IF;
  
  -- Check if user is a provider
  IF EXISTS (SELECT 1 FROM providers WHERE user_id = user_uuid) THEN
    roles_array := array_append(roles_array, 'provider');
    IF primary_role IS NULL THEN
      primary_role := 'provider';
    END IF;
  END IF;
  
  -- Check if user is an admin
  IF EXISTS (SELECT 1 FROM admins WHERE user_id = user_uuid) THEN
    roles_array := array_append(roles_array, 'admin');
    IF primary_role IS NULL THEN
      primary_role := 'admin';
    END IF;
  END IF;
  
  -- Return as JSON
  result := json_build_object(
    'roles', to_jsonb(roles_array),
    'primary_role', primary_role,
    'primaryRole', primary_role
  );
  
  RETURN result;
END;
$$;


ALTER FUNCTION "public"."get_user_roles"("user_uuid" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_user_roles_secure"("user_id_param" "uuid") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  roles_array TEXT[] := '{}';
  primary_role TEXT := NULL;
BEGIN
  -- Check if user is an admin
  IF EXISTS (SELECT 1 FROM admins WHERE user_id = user_id_param) THEN
    roles_array := array_append(roles_array, 'admin');
    primary_role := 'admin';
  END IF;
  
  -- Check if user is a provider
  IF EXISTS (SELECT 1 FROM providers WHERE user_id = user_id_param) THEN
    roles_array := array_append(roles_array, 'provider');
    IF primary_role IS NULL THEN
      primary_role := 'provider';
    END IF;
  END IF;
  
  -- Check if user is a patient
  IF EXISTS (SELECT 1 FROM patients WHERE user_id = user_id_param) THEN
    roles_array := array_append(roles_array, 'patient');
    IF primary_role IS NULL THEN
      primary_role := 'patient';
    END IF;
  END IF;
  
  RETURN json_build_object(
    'roles', roles_array,
    'primary_role', primary_role,
    'primaryRole', primary_role  -- For backwards compatibility
  );
END;
$$;


ALTER FUNCTION "public"."get_user_roles_secure"("user_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  user_role text;
BEGIN
  -- Get the user role from raw_user_meta_data
  user_role := NEW.raw_user_meta_data->>'role';
  
  -- Create records based on role
  IF user_role = 'patient' THEN
    INSERT INTO patients (id, user_id, email, first_name, last_name, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Patient'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
      NOW(),
      NOW()
    );
  ELSIF user_role = 'provider' THEN
    INSERT INTO providers (id, user_id, email, first_name, last_name, specialty, license_number, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Provider'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
      COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Practice'),
      COALESCE(NEW.raw_user_meta_data->>'license_number', 'TBD'),
      NOW(),
      NOW()
    );
  ELSIF user_role = 'admin' THEN
    -- Include all required columns for admins table
    INSERT INTO admins (id, user_id, email, first_name, last_name, role, permissions, active, created_at, updated_at)
    VALUES (
      gen_random_uuid(),
      NEW.id,
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin'),
      COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
      'admin',
      '{messages,patients,dashboard}',  -- Default permissions
      'true',  -- Active by default
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."test_connection"() RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN 'Database connection working at ' || NOW()::TEXT;
END;
$$;


ALTER FUNCTION "public"."test_connection"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."admins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text",
    "permissions" "text"[] DEFAULT '{messages,patients,dashboard}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "active" "text" DEFAULT 'true'::"text"
);


ALTER TABLE "public"."admins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."kv_store_a1a84b3e" (
    "key" "text" NOT NULL,
    "value" "jsonb" NOT NULL
);


ALTER TABLE "public"."kv_store_a1a84b3e" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "thread_id" "uuid" NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "sender_type" "text" NOT NULL,
    "recipient_id" "uuid",
    "recipient_type" "text",
    "subject" "text" NOT NULL,
    "content" "text" NOT NULL,
    "is_read" boolean DEFAULT false,
    "is_reply" boolean DEFAULT false,
    "parent_message_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "messages_recipient_type_check" CHECK (("recipient_type" = ANY (ARRAY['patient'::"text", 'admin'::"text"]))),
    CONSTRAINT "messages_sender_type_check" CHECK (("sender_type" = ANY (ARRAY['patient'::"text", 'admin'::"text"])))
);


ALTER TABLE "public"."messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patient_providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "patient_id" "uuid",
    "provider_id" "uuid",
    "treatment_type" "text" NOT NULL,
    "assigned_date" timestamp without time zone DEFAULT "now"(),
    "is_primary" boolean DEFAULT false
);


ALTER TABLE "public"."patient_providers" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."patients" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "has_completed_intake" boolean DEFAULT false,
    "intake_data" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "active" "text" DEFAULT 'true'::"text"
);


ALTER TABLE "public"."patients" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."providers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "email" "text" NOT NULL,
    "first_name" "text" NOT NULL,
    "last_name" "text" NOT NULL,
    "role" "text" DEFAULT 'admin'::"text",
    "permissions" "text"[] DEFAULT '{messages,patients,dashboard}'::"text"[],
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "active" "text" DEFAULT 'true'::"text"
);


ALTER TABLE "public"."providers" OWNER TO "postgres";


ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."admins"
    ADD CONSTRAINT "admins_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."kv_store_a1a84b3e"
    ADD CONSTRAINT "kv_store_a1a84b3e_pkey" PRIMARY KEY ("key");



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patient_providers"
    ADD CONSTRAINT "patient_providers_patient_id_provider_id_treatment_type_key" UNIQUE ("patient_id", "provider_id", "treatment_type");



ALTER TABLE ONLY "public"."patient_providers"
    ADD CONSTRAINT "patient_providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."patients"
    ADD CONSTRAINT "patients_user_id_key" UNIQUE ("user_id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."providers"
    ADD CONSTRAINT "providers_user_id_key" UNIQUE ("user_id");



CREATE INDEX "idx_admins_email" ON "public"."admins" USING "btree" ("email");



CREATE INDEX "idx_admins_user_id" ON "public"."admins" USING "btree" ("user_id");



CREATE INDEX "idx_messages_created_at" ON "public"."messages" USING "btree" ("created_at");



CREATE INDEX "idx_messages_is_reply" ON "public"."messages" USING "btree" ("is_reply");



CREATE INDEX "idx_messages_recipient_id" ON "public"."messages" USING "btree" ("recipient_id");



CREATE INDEX "idx_messages_sender_id" ON "public"."messages" USING "btree" ("sender_id");



CREATE INDEX "idx_messages_thread_id" ON "public"."messages" USING "btree" ("thread_id");



CREATE INDEX "idx_patients_email" ON "public"."patients" USING "btree" ("email");



CREATE INDEX "idx_patients_user_id" ON "public"."patients" USING "btree" ("user_id");



CREATE INDEX "kv_store_a1a84b3e_key_idx" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx1" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx10" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx11" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx12" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx13" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx14" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx15" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx16" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx2" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx3" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx4" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx5" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx6" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx7" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx8" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "kv_store_a1a84b3e_key_idx9" ON "public"."kv_store_a1a84b3e" USING "btree" ("key" "text_pattern_ops");



CREATE INDEX "providers_email_idx" ON "public"."providers" USING "btree" ("email");



CREATE INDEX "providers_user_id_idx" ON "public"."providers" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "update_admins_updated_at" BEFORE UPDATE ON "public"."admins" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_messages_updated_at" BEFORE UPDATE ON "public"."messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_patients_updated_at" BEFORE UPDATE ON "public"."patients" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."messages"
    ADD CONSTRAINT "messages_parent_message_id_fkey" FOREIGN KEY ("parent_message_id") REFERENCES "public"."messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_providers"
    ADD CONSTRAINT "patient_providers_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."patient_providers"
    ADD CONSTRAINT "patient_providers_provider_id_fkey" FOREIGN KEY ("provider_id") REFERENCES "public"."providers"("id") ON DELETE CASCADE;



CREATE POLICY "Admins can manage all assignments" ON "public"."patient_providers" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can read their own
  admin data" ON "public"."admins" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Admins can update their own
  admin data" ON "public"."admins" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Admins can view all admin data" ON "public"."admins" USING ((EXISTS ( SELECT 1
   FROM "public"."admins" "admins_1"
  WHERE ("admins_1"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all patients" ON "public"."patients" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."user_id" = "auth"."uid"()))));



CREATE POLICY "Admins can view all providers" ON "public"."providers" USING ((EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."user_id" = "auth"."uid"()))));



CREATE POLICY "Patients can view own data" ON "public"."patients" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Patients can view their assignments" ON "public"."patient_providers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."patients"
  WHERE (("patients"."id" = "patient_providers"."patient_id") AND ("patients"."user_id" = "auth"."uid"())))));



CREATE POLICY "Providers can view assigned patients" ON "public"."patients" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM ("public"."patient_providers" "pp"
     JOIN "public"."providers" "prov" ON (("prov"."id" = "pp"."provider_id")))
  WHERE (("pp"."patient_id" = "patients"."id") AND ("prov"."user_id" = "auth"."uid"())))));



CREATE POLICY "Providers can view their assignments" ON "public"."patient_providers" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."providers"
  WHERE (("providers"."id" = "patient_providers"."provider_id") AND ("providers"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can create messages" ON "public"."messages" FOR INSERT WITH CHECK (("sender_id" = "auth"."uid"()));



CREATE POLICY "Users can delete their own
  patient data" ON "public"."patients" FOR DELETE TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own
  admin record" ON "public"."admins" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can insert their own
  patient record" ON "public"."patients" FOR INSERT TO "authenticated" WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can read their own
  patient data" ON "public"."patients" FOR SELECT TO "authenticated" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own patient data" ON "public"."patients" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update own provider data" ON "public"."providers" FOR UPDATE USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can update their own
  patient data" ON "public"."patients" FOR UPDATE TO "authenticated" USING (("auth"."uid"() = "user_id")) WITH CHECK (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own admin data" ON "public"."admins" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own messages" ON "public"."messages" FOR SELECT USING ((("sender_id" = "auth"."uid"()) OR ("recipient_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."admins"
  WHERE ("admins"."user_id" = "auth"."uid"())))));



CREATE POLICY "Users can view own patient data" ON "public"."patients" FOR SELECT USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view own provider data" ON "public"."providers" FOR SELECT USING (("auth"."uid"() = "user_id"));



ALTER TABLE "public"."admins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."kv_store_a1a84b3e" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patient_providers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."patients" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."providers" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."assign_patient_to_provider"("patient_uuid" "uuid", "provider_uuid" "uuid", "treatment_type_param" "text", "is_primary_param" boolean) TO "anon";
GRANT ALL ON FUNCTION "public"."assign_patient_to_provider"("patient_uuid" "uuid", "provider_uuid" "uuid", "treatment_type_param" "text", "is_primary_param" boolean) TO "authenticated";
GRANT ALL ON FUNCTION "public"."assign_patient_to_provider"("patient_uuid" "uuid", "provider_uuid" "uuid", "treatment_type_param" "text", "is_primary_param" boolean) TO "service_role";



GRANT ALL ON FUNCTION "public"."create_admin_record"("user_id_param" "uuid", "email_param" "text", "first_name_param" "text", "last_name_param" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_admin_record"("user_id_param" "uuid", "email_param" "text", "first_name_param" "text", "last_name_param" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_admin_record"("user_id_param" "uuid", "email_param" "text", "first_name_param" "text", "last_name_param" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."debug_table_info"() TO "anon";
GRANT ALL ON FUNCTION "public"."debug_table_info"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."debug_table_info"() TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_roles"("user_uuid" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_roles"("user_uuid" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_roles"("user_uuid" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_user_roles_secure"("user_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_user_roles_secure"("user_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_user_roles_secure"("user_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."test_connection"() TO "anon";
GRANT ALL ON FUNCTION "public"."test_connection"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."test_connection"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";


















GRANT ALL ON TABLE "public"."admins" TO "anon";
GRANT ALL ON TABLE "public"."admins" TO "authenticated";
GRANT ALL ON TABLE "public"."admins" TO "service_role";



GRANT ALL ON TABLE "public"."kv_store_a1a84b3e" TO "anon";
GRANT ALL ON TABLE "public"."kv_store_a1a84b3e" TO "authenticated";
GRANT ALL ON TABLE "public"."kv_store_a1a84b3e" TO "service_role";



GRANT ALL ON TABLE "public"."messages" TO "anon";
GRANT ALL ON TABLE "public"."messages" TO "authenticated";
GRANT ALL ON TABLE "public"."messages" TO "service_role";



GRANT ALL ON TABLE "public"."patient_providers" TO "anon";
GRANT ALL ON TABLE "public"."patient_providers" TO "authenticated";
GRANT ALL ON TABLE "public"."patient_providers" TO "service_role";



GRANT ALL ON TABLE "public"."patients" TO "anon";
GRANT ALL ON TABLE "public"."patients" TO "authenticated";
GRANT ALL ON TABLE "public"."patients" TO "service_role";



GRANT ALL ON TABLE "public"."providers" TO "anon";
GRANT ALL ON TABLE "public"."providers" TO "authenticated";
GRANT ALL ON TABLE "public"."providers" TO "service_role";









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
