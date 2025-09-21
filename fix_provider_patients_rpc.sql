-- Fix the RPC function to handle timestamp vs date type mismatch
-- Run this in Supabase Dashboard → SQL Editor

-- Drop and recreate the function with correct data types
DROP FUNCTION IF EXISTS get_provider_patients(UUID);

CREATE OR REPLACE FUNCTION get_provider_patients(provider_uuid UUID)
RETURNS TABLE (
  patient_id UUID,
  patient_first_name TEXT,
  patient_last_name TEXT,
  patient_email TEXT,
  treatment_type TEXT,
  is_primary BOOLEAN,
  assigned_date TIMESTAMPTZ  -- Changed from DATE to TIMESTAMPTZ to match actual column type
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pp.patient_id,
    pt.first_name,
    pt.last_name,
    pt.email,
    pp.treatment_type,
    pp.is_primary,
    pp.assigned_date
  FROM patient_providers pp
  JOIN patients pt ON pp.patient_id = pt.id
  WHERE pp.provider_id = provider_uuid;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_provider_patients(UUID) TO authenticated;