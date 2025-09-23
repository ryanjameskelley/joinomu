-- Fix issues in patient query functions

-- Drop and recreate the provider function with correct date handling
DROP FUNCTION IF EXISTS get_assigned_patients_for_provider(UUID);

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
    pa.assigned_date::DATE, -- Cast to DATE to match return type
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

-- Fix the assignment function to use correct patient lookup
DROP FUNCTION IF EXISTS assign_patient_to_provider(UUID, UUID, TEXT, BOOLEAN);

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
  patient_exists BOOLEAN;
BEGIN
  -- Check if patient exists
  SELECT EXISTS(
    SELECT 1 FROM patients WHERE profile_id = patient_profile_id
  ) INTO patient_exists;
  
  IF NOT patient_exists THEN
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_assigned_patients_for_provider(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION assign_patient_to_provider(UUID, UUID, TEXT, BOOLEAN) TO authenticated;