-- Fix admin patient query to only show actual patients, not admins
-- Also fix medication data aggregation

DROP FUNCTION IF EXISTS get_all_patients_for_admin();

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
  medications TEXT[],
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
    COALESCE(
      ARRAY_AGG(DISTINCT m.name) FILTER (WHERE m.name IS NOT NULL),
      '{}'::TEXT[]
    ) as medications,
    p.created_at
  FROM patients p
  INNER JOIN profiles prof ON p.profile_id = prof.id
  LEFT JOIN patient_assignments pa ON p.profile_id = pa.patient_id
  LEFT JOIN providers prov ON pa.provider_id = prov.id
  LEFT JOIN profiles prov_prof ON prov.profile_id = prov_prof.id
  LEFT JOIN patient_medication_preferences pmp ON p.id = pmp.patient_id
  LEFT JOIN medications m ON pmp.medication_id = m.id
  WHERE prof.role = 'patient'  -- Only include users with patient role
  GROUP BY p.id, p.profile_id, prof.first_name, prof.last_name, prof.email, p.phone, p.date_of_birth, p.has_completed_intake, p.created_at
  ORDER BY prof.first_name, prof.last_name;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_all_patients_for_admin() TO authenticated;