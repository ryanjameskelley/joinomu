-- Production User System Setup
-- Run this in Supabase Dashboard → SQL Editor

-- ===========================================
-- 1. CREATE DATABASE TRIGGERS FOR AUTO USER CREATION
-- ===========================================

-- Function to create user records automatically
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger 
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  user_role text;
BEGIN
  -- Get the user role from raw_user_meta_data
  user_role := NEW.raw_user_meta_data->>'role';
  
  -- Create records based on role
  CASE user_role
    WHEN 'patient' THEN
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
      
    WHEN 'provider' THEN
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
      
    WHEN 'admin' THEN
      INSERT INTO admins (id, user_id, email, first_name, last_name, role, created_at, updated_at)
      VALUES (
        gen_random_uuid(),
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'first_name', 'Admin'),
        COALESCE(NEW.raw_user_meta_data->>'last_name', 'User'),
        'admin',
        NOW(),
        NOW()
      );
  END CASE;
  
  RETURN NEW;
END;
$function$;

-- Create trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ===========================================
-- 2. PROPER RLS POLICIES
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_providers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own patient data" ON patients;
DROP POLICY IF EXISTS "Users can update own patient data" ON patients;
DROP POLICY IF EXISTS "Providers can view assigned patients" ON patients;
DROP POLICY IF EXISTS "Admins can view all patients" ON patients;

DROP POLICY IF EXISTS "Users can view own provider data" ON providers;
DROP POLICY IF EXISTS "Users can update own provider data" ON providers;
DROP POLICY IF EXISTS "Admins can view all providers" ON providers;

DROP POLICY IF EXISTS "Users can view own admin data" ON admins;
DROP POLICY IF EXISTS "Admins can view all admin data" ON admins;

DROP POLICY IF EXISTS "Providers can view their assignments" ON patient_providers;
DROP POLICY IF EXISTS "Patients can view their assignments" ON patient_providers;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON patient_providers;

-- PATIENTS TABLE POLICIES
CREATE POLICY "Users can view own patient data" ON patients
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own patient data" ON patients
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Providers can view assigned patients" ON patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patient_providers pp
      JOIN providers prov ON prov.id = pp.provider_id
      WHERE pp.patient_id = patients.id 
      AND prov.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can view all patients" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- PROVIDERS TABLE POLICIES
CREATE POLICY "Users can view own provider data" ON providers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own provider data" ON providers
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all providers" ON providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- ADMINS TABLE POLICIES
CREATE POLICY "Users can view own admin data" ON admins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all admin data" ON admins
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- PATIENT_PROVIDERS TABLE POLICIES
CREATE POLICY "Providers can view their assignments" ON patient_providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM providers 
      WHERE id = patient_providers.provider_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Patients can view their assignments" ON patient_providers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE id = patient_providers.patient_id 
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all assignments" ON patient_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE user_id = auth.uid()
    )
  );

-- ===========================================
-- 3. HELPER FUNCTIONS FOR ROLE DETECTION
-- ===========================================

-- Update the role detection function to work with proper RLS
CREATE OR REPLACE FUNCTION get_user_roles(user_uuid UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $func$
DECLARE
  roles_array TEXT[] := '{}';
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
$func$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_roles(UUID) TO anon;

-- ===========================================
-- 4. ASSIGNMENT MANAGEMENT FUNCTIONS
-- ===========================================

-- Function for admins to assign patients to providers
CREATE OR REPLACE FUNCTION assign_patient_to_provider(
  patient_uuid UUID,
  provider_uuid UUID,
  treatment_type_param TEXT DEFAULT 'general_care',
  is_primary_param BOOLEAN DEFAULT false
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $assign$
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
$assign$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION assign_patient_to_provider(UUID, UUID, TEXT, BOOLEAN) TO authenticated;

-- ===========================================
-- 5. CLEANUP EXISTING DATA
-- ===========================================

-- Remove existing RPC bypass functions (keep role detection)
DROP FUNCTION IF EXISTS create_missing_patients();
DROP FUNCTION IF EXISTS get_provider_by_user_id(UUID);
DROP FUNCTION IF EXISTS get_provider_patients(UUID);

-- Clear existing test data for clean start
DELETE FROM patient_providers;
DELETE FROM patients WHERE email LIKE '%@example.com' OR email = 'ryan@ryankelleydesign.com';
DELETE FROM providers WHERE email LIKE '%provider%' OR email = 'ryan@ryankelleydesign.com';
DELETE FROM admins WHERE email LIKE '%admin%' OR email = 'ryan@ryankelleydesign.com';

COMMIT;