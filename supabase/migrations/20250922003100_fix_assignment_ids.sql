-- Fix the assignment function to use correct patient and provider IDs

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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION assign_patient_to_provider(UUID, UUID, TEXT, BOOLEAN) TO authenticated;