-- Authentication Trigger and RLS Policies Migration
-- This migration creates the new simplified auth trigger and clean RLS policies

-- Create the new authentication trigger function
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Log the trigger execution
  RAISE LOG 'handle_new_user triggered for user: %, role: %', NEW.id, NEW.raw_user_meta_data->>'role';
  
  -- Create profile record first
  INSERT INTO profiles (id, email, role, first_name, last_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'patient'),
    COALESCE(NEW.raw_user_meta_data->>'first_name', 'User'),
    COALESCE(NEW.raw_user_meta_data->>'last_name', 'Name')
  );
  
  -- Create role-specific record based on profile.role
  IF (COALESCE(NEW.raw_user_meta_data->>'role', 'patient') = 'patient') THEN
    INSERT INTO patients (profile_id, date_of_birth, phone, has_completed_intake)
    VALUES (
      NEW.id,
      (NEW.raw_user_meta_data->>'date_of_birth')::DATE,
      NEW.raw_user_meta_data->>'phone',
      false
    );
    RAISE LOG 'Patient record created for user: %', NEW.id;
    
  ELSIF (NEW.raw_user_meta_data->>'role' = 'admin') THEN
    INSERT INTO admins (profile_id, permissions, active)
    VALUES (
      NEW.id,
      ARRAY['dashboard', 'patients', 'providers', 'assignments'],
      true
    );
    RAISE LOG 'Admin record created for user: %', NEW.id;
    
  ELSIF (NEW.raw_user_meta_data->>'role' = 'provider') THEN
    INSERT INTO providers (profile_id, specialty, license_number, phone, active)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data->>'specialty', 'General Practice'),
      COALESCE(NEW.raw_user_meta_data->>'license_number', 'PENDING'),
      NEW.raw_user_meta_data->>'phone',
      true
    );
    RAISE LOG 'Provider record created for user: %', NEW.id;
  END IF;
  
  RETURN NEW;
EXCEPTION 
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user trigger for user %: %', NEW.id, SQLERRM;
    -- Don't fail the auth signup if user record creation fails
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger on auth.users
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Profiles policies
CREATE POLICY "Users can view own profile" 
  ON profiles FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" 
  ON profiles FOR UPDATE 
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" 
  ON profiles FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE profile_id = auth.uid() AND active = true
    )
  );

-- Patients policies  
CREATE POLICY "Patients can view own data" 
  ON patients FOR SELECT 
  USING (profile_id = auth.uid());

CREATE POLICY "Patients can update own data" 
  ON patients FOR UPDATE 
  USING (profile_id = auth.uid());

CREATE POLICY "Providers can view assigned patients" 
  ON patients FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM patient_assignments pa 
      JOIN providers p ON p.id = pa.provider_id 
      WHERE p.profile_id = auth.uid() 
        AND pa.patient_id = patients.id 
        AND pa.active = true
    )
  );

CREATE POLICY "Admins can manage all patients" 
  ON patients FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE profile_id = auth.uid() AND active = true
    )
  );

-- Providers policies
CREATE POLICY "Providers can view own data" 
  ON providers FOR SELECT 
  USING (profile_id = auth.uid());

CREATE POLICY "Providers can update own data" 
  ON providers FOR UPDATE 
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can manage all providers" 
  ON providers FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE profile_id = auth.uid() AND active = true
    )
  );

-- Admins policies
CREATE POLICY "Admins can view own data" 
  ON admins FOR SELECT 
  USING (profile_id = auth.uid());

CREATE POLICY "Admins can update own data" 
  ON admins FOR UPDATE 
  USING (profile_id = auth.uid());

CREATE POLICY "Super admins can manage all admins" 
  ON admins FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE profile_id = auth.uid() 
        AND active = true 
        AND 'super_admin' = ANY(permissions)
    )
  );

-- Patient assignments policies
CREATE POLICY "Patients can view own assignments" 
  ON patient_assignments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE id = patient_assignments.patient_id 
        AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Providers can view their assignments" 
  ON patient_assignments FOR SELECT 
  USING (
    EXISTS (
      SELECT 1 FROM providers 
      WHERE id = patient_assignments.provider_id 
        AND profile_id = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all assignments" 
  ON patient_assignments FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE profile_id = auth.uid() AND active = true
    )
  );

-- Create a simple function to get user role
CREATE OR REPLACE FUNCTION get_user_role(user_id UUID DEFAULT auth.uid())
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM profiles 
    WHERE id = user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to assign patients to providers (admin only)
CREATE OR REPLACE FUNCTION assign_patient_to_provider(
  patient_profile_id UUID,
  provider_profile_id UUID,
  treatment_type_param TEXT DEFAULT 'general_care',
  is_primary_param BOOLEAN DEFAULT false
)
RETURNS JSON AS $$
DECLARE
  patient_record_id UUID;
  provider_record_id UUID;
  assignment_id UUID;
BEGIN
  -- Check if caller is admin
  IF NOT EXISTS (
    SELECT 1 FROM admins 
    WHERE profile_id = auth.uid() AND active = true
  ) THEN
    RETURN json_build_object('success', false, 'error', 'Admin access required');
  END IF;
  
  -- Get patient record ID
  SELECT id INTO patient_record_id 
  FROM patients 
  WHERE profile_id = patient_profile_id;
  
  IF patient_record_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Patient not found');
  END IF;
  
  -- Get provider record ID
  SELECT id INTO provider_record_id 
  FROM providers 
  WHERE profile_id = provider_profile_id;
  
  IF provider_record_id IS NULL THEN
    RETURN json_build_object('success', false, 'error', 'Provider not found');
  END IF;
  
  -- If setting as primary, deactivate other primary assignments
  IF is_primary_param THEN
    UPDATE patient_assignments 
    SET is_primary = false 
    WHERE patient_id = patient_record_id AND is_primary = true AND active = true;
  END IF;
  
  -- Create the assignment
  INSERT INTO patient_assignments (patient_id, provider_id, treatment_type, is_primary)
  VALUES (patient_record_id, provider_record_id, treatment_type_param, is_primary_param)
  RETURNING id INTO assignment_id;
  
  RETURN json_build_object(
    'success', true, 
    'assignment_id', assignment_id,
    'patient_id', patient_record_id,
    'provider_id', provider_record_id
  );
  
EXCEPTION 
  WHEN OTHERS THEN
    RETURN json_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

RAISE NOTICE 'Authentication trigger and RLS policies created successfully';