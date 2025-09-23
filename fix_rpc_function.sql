-- Fix the provider patient query function

-- Drop and recreate the function with correct logic
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
    pa.assigned_date,
    pa.is_primary,
    p.has_completed_intake,
    p.created_at
  FROM patients p
  INNER JOIN profiles prof ON p.profile_id = prof.id
  INNER JOIN patient_assignments pa ON p.id = pa.patient_id  -- Fixed: use p.id instead of p.profile_id
  INNER JOIN providers prov ON pa.provider_id = prov.id
  WHERE prov.profile_id = provider_profile_id
  AND pa.active = true  -- Only active assignments
  ORDER BY pa.assigned_date DESC, prof.first_name, prof.last_name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_assigned_patients_for_provider(UUID) TO authenticated;