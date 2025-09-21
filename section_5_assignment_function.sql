-- ===========================================
-- SECTION 5: Assignment Management Function
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
AS '
DECLARE
  result JSON;
  assignment_id UUID;
BEGIN
  -- Check if user is an admin
  IF NOT EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid()) THEN
    RETURN json_build_object(
      ''success'', false,
      ''error'', ''Only admins can assign patients to providers''
    );
  END IF;
  
  -- Check if patient exists
  IF NOT EXISTS (SELECT 1 FROM patients WHERE id = patient_uuid) THEN
    RETURN json_build_object(
      ''success'', false,
      ''error'', ''Patient not found''
    );
  END IF;
  
  -- Check if provider exists
  IF NOT EXISTS (SELECT 1 FROM providers WHERE id = provider_uuid) THEN
    RETURN json_build_object(
      ''success'', false,
      ''error'', ''Provider not found''
    );
  END IF;
  
  -- Create assignment
  INSERT INTO patient_providers (id, patient_id, provider_id, treatment_type, is_primary, assigned_date)
  VALUES (gen_random_uuid(), patient_uuid, provider_uuid, treatment_type_param, is_primary_param, NOW())
  RETURNING id INTO assignment_id;
  
  RETURN json_build_object(
    ''success'', true,
    ''assignment_id'', assignment_id,
    ''message'', ''Patient successfully assigned to provider''
  );
END;
';

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION assign_patient_to_provider(UUID, UUID, TEXT, BOOLEAN) TO authenticated;