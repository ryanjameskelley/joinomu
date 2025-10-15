-- Temporarily disable RLS on auth-related tables for development
-- Run this in Supabase SQL Editor to fix signup issues

-- Disable RLS on profile tables to allow auth trigger to work
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE patients DISABLE ROW LEVEL SECURITY;
ALTER TABLE providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE admins DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on clinical notes tables for testing
ALTER TABLE clinical_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE visit_medication_adjustments DISABLE ROW LEVEL SECURITY;
ALTER TABLE visit_interactions DISABLE ROW LEVEL SECURITY;

-- Check that tables exist
SELECT table_name, row_security 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('profiles', 'patients', 'providers', 'clinical_notes');