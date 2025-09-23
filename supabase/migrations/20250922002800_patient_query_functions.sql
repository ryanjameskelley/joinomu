-- Patient Query Functions for Role-based Access
-- This migration creates functions for admins and providers to query patients

-- Drop existing functions if they exist
DROP FUNCTION IF EXISTS assign_patient_to_provider(UUID, UUID, TEXT, BOOLEAN);
DROP FUNCTION IF EXISTS get_all_patients_for_admin();
DROP FUNCTION IF EXISTS get_assigned_patients_for_provider(UUID);
DROP FUNCTION IF EXISTS get_provider_by_profile_id(UUID);

-- Function for admins to get all patients with their assigned providers
CREATE OR REPLACE FUNCTION get_all_patients_for_admin()
RETURNS TABLE (
  patient_id UUID,
  profile_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  has_completed_intake BOOLEAN,
  assigned_providers TEXT[],
  treatment_types TEXT[],
  created_at TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
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
    p.created_at
  FROM patients p
  INNER JOIN profiles prof ON p.profile_id = prof.id
  LEFT JOIN patient_assignments pa ON p.profile_id = pa.patient_id
  LEFT JOIN providers prov ON pa.provider_id = prov.id
  LEFT JOIN profiles prov_prof ON prov.profile_id = prov_prof.id
  GROUP BY p.id, p.profile_id, prof.first_name, prof.last_name, prof.email, p.phone, p.date_of_birth, p.has_completed_intake, p.created_at
  ORDER BY prof.first_name, prof.last_name;
END;
$$;

-- Function for providers to get their assigned patients
CREATE OR REPLACE FUNCTION get_assigned_patients_for_provider(provider_profile_id UUID)
RETURNS TABLE (
  patient_id UUID,
  profile_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  phone TEXT,
  date_of_birth DATE,
  treatment_type TEXT,
  assigned_date DATE,
  is_primary BOOLEAN,
  has_completed_intake BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
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
    pa.assigned_date,
    pa.is_primary,
    p.has_completed_intake,
    p.created_at
  FROM patients p
  INNER JOIN profiles prof ON p.profile_id = prof.id
  INNER JOIN patient_assignments pa ON p.profile_id = pa.patient_id
  INNER JOIN providers prov ON pa.provider_id = prov.id
  WHERE prov.profile_id = provider_profile_id
  ORDER BY pa.assigned_date DESC, prof.first_name, prof.last_name;
END;
$$;

-- Function to get provider details by profile ID (helper function)
CREATE OR REPLACE FUNCTION get_provider_by_profile_id(provider_profile_id UUID)
RETURNS TABLE (
  provider_id UUID,
  profile_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  specialty TEXT,
  license_number TEXT,
  phone TEXT,
  active BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
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

-- Function to assign patient to provider (admin only)
CREATE OR REPLACE FUNCTION assign_patient_to_provider(
  patient_profile_id UUID,
  provider_profile_id UUID,
  treatment_type_param TEXT DEFAULT 'general_care',
  is_primary_param BOOLEAN DEFAULT false
)
RETURNS TABLE (
  success BOOLEAN,
  message TEXT,
  assignment_id UUID
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  provider_id_var UUID;
  assignment_id_var UUID;
BEGIN
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
    WHERE patient_id = patient_profile_id 
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
    patient_profile_id,
    provider_id_var,
    treatment_type_param,
    is_primary_param,
    CURRENT_DATE
  ) RETURNING id INTO assignment_id_var;
  
  RETURN QUERY SELECT true, 'Patient successfully assigned to provider', assignment_id_var;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_all_patients_for_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION get_assigned_patients_for_provider(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_by_profile_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_patient_to_provider(UUID, UUID, TEXT, BOOLEAN) TO authenticated;