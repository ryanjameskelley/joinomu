-- New Clean Schema Migration
-- This migration creates the new simplified authentication schema
-- Based on a single profiles table with role-specific extensions

-- Enable Row Level Security on all tables by default
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Core profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  role TEXT NOT NULL CHECK (role IN ('patient', 'admin', 'provider')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Patients table (only patient-specific data)
CREATE TABLE patients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  date_of_birth DATE,
  phone TEXT,
  has_completed_intake BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on patients
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Providers table (only provider-specific data)
CREATE TABLE providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  specialty TEXT,
  license_number TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on providers
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;

-- Admins table (only admin-specific data)
CREATE TABLE admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,
  permissions TEXT[] DEFAULT ARRAY['dashboard'],
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on admins
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;

-- Patient-Provider relationships (renamed from patient_providers)
CREATE TABLE patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES providers(id) ON DELETE CASCADE NOT NULL,
  treatment_type TEXT DEFAULT 'general_care',
  is_primary BOOLEAN DEFAULT false,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure unique primary assignments per patient
  CONSTRAINT unique_primary_assignment 
    EXCLUDE (patient_id WITH =) WHERE (is_primary = true AND active = true)
);

-- Enable RLS on patient_assignments
ALTER TABLE patient_assignments ENABLE ROW LEVEL SECURITY;

-- Create indexes for better performance
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_email ON profiles(email);
CREATE INDEX idx_patients_profile_id ON patients(profile_id);
CREATE INDEX idx_providers_profile_id ON providers(profile_id);
CREATE INDEX idx_admins_profile_id ON admins(profile_id);
CREATE INDEX idx_patient_assignments_patient_id ON patient_assignments(patient_id);
CREATE INDEX idx_patient_assignments_provider_id ON patient_assignments(provider_id);
CREATE INDEX idx_patient_assignments_active ON patient_assignments(active);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add updated_at triggers to all tables
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patients_updated_at
  BEFORE UPDATE ON patients
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_providers_updated_at
  BEFORE UPDATE ON providers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admins_updated_at
  BEFORE UPDATE ON admins
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_assignments_updated_at
  BEFORE UPDATE ON patient_assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

RAISE NOTICE 'New clean schema created successfully';