-- RPC functions to bypass RLS for provider dashboard data access
-- Run this in Supabase Dashboard → SQL Editor

-- 1. Function to get provider data by user_id (bypasses RLS)
CREATE OR REPLACE FUNCTION get_provider_by_user_id(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.user_id,
    p.first_name,
    p.last_name,
    p.email,
    p.created_at,
    p.updated_at
  FROM providers p
  WHERE p.user_id = user_uuid;
END;
$$;

-- 2. Function to get provider's assigned patients (bypasses RLS)
CREATE OR REPLACE FUNCTION get_provider_patients(provider_uuid UUID)
RETURNS TABLE (
  patient_id UUID,
  patient_first_name TEXT,
  patient_last_name TEXT,
  patient_email TEXT,
  treatment_type TEXT,
  is_primary BOOLEAN,
  assigned_date DATE
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

-- 3. Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION get_provider_by_user_id(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_provider_patients(UUID) TO authenticated;