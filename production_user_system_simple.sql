-- Production User System Setup - Simple Version
-- Run each section separately in Supabase Dashboard → SQL Editor

-- ===========================================
-- SECTION 1: Enable RLS and Drop Existing Policies
-- ===========================================

-- Enable RLS on all tables
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_providers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own patient data" ON patients;
DROP POLICY IF EXISTS "Users can update own patient data" ON patients;
DROP POLICY IF EXISTS "Providers can view assigned patients" ON patients;
DROP POLICY IF EXISTS "Admins can view all patients" ON patients;

DROP POLICY IF EXISTS "Users can view own provider data" ON providers;
DROP POLICY IF EXISTS "Users can update own provider data" ON providers;
DROP POLICY IF EXISTS "Admins can view all providers" ON providers;

DROP POLICY IF EXISTS "Users can view own admin data" ON admins;
DROP POLICY IF EXISTS "Admins can view all admin data" ON admins;

DROP POLICY IF EXISTS "Providers can view their assignments" ON patient_providers;
DROP POLICY IF EXISTS "Patients can view their assignments" ON patient_providers;
DROP POLICY IF EXISTS "Admins can manage all assignments" ON patient_providers;