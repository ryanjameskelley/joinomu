-- Final fix for authentication system
-- Simplify RLS policies and ensure trigger works properly

-- Temporarily disable RLS to insert test data and debug
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;
ALTER TABLE patient_assignments DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to start fresh
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Patients can view own data" ON patients;
DROP POLICY IF EXISTS "Patients can update own data" ON patients;
DROP POLICY IF EXISTS "Providers can view assigned patients" ON patients;
DROP POLICY IF EXISTS "Admins can manage all patients" ON patients;
DROP POLICY IF EXISTS "Providers can view own data" ON providers;
DROP POLICY IF EXISTS "Providers can update own data" ON providers;
DROP POLICY IF EXISTS "Admins can manage all providers" ON providers;
DROP POLICY IF EXISTS "Admins can view own data" ON admins;
DROP POLICY IF EXISTS "Admins can update own data" ON admins;
DROP POLICY IF EXISTS "Patients can view own assignments" ON patient_assignments;
DROP POLICY IF EXISTS "Providers can view their assignments" ON patient_assignments;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON patient_assignments;

-- Create very simple RLS policies
-- Profiles: Users can see and update their own profile, admins can see all
CREATE POLICY "profiles_self_access" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "profiles_admin_access" ON profiles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE profile_id = auth.uid() AND active = true
    )
  );

-- Patients: Users can see and update their own data, admins can see all
CREATE POLICY "patients_self_access" ON patients
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "patients_admin_access" ON patients
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE profile_id = auth.uid() AND active = true
    )
  );

-- Providers: Users can see and update their own data, admins can see all
CREATE POLICY "providers_self_access" ON providers
  FOR ALL USING (profile_id = auth.uid());

CREATE POLICY "providers_admin_access" ON providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE profile_id = auth.uid() AND active = true
    )
  );

-- Admins: Users can see and update their own data
CREATE POLICY "admins_self_access" ON admins
  FOR ALL USING (profile_id = auth.uid());

-- Patient assignments: Simple access for all roles
CREATE POLICY "assignments_patient_access" ON patient_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM patients 
      WHERE id = patient_assignments.patient_id 
        AND profile_id = auth.uid()
    )
  );

CREATE POLICY "assignments_provider_access" ON patient_assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM providers 
      WHERE id = patient_assignments.provider_id 
        AND profile_id = auth.uid()
    )
  );

CREATE POLICY "assignments_admin_access" ON patient_assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins 
      WHERE profile_id = auth.uid() AND active = true
    )
  );

-- Re-enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;