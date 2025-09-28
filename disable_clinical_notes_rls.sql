-- Temporarily disable RLS for clinical notes tables during development
-- Run this in Supabase SQL Editor for testing

-- Disable RLS on clinical notes tables
ALTER TABLE clinical_notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE visit_medication_adjustments DISABLE ROW LEVEL SECURITY;
ALTER TABLE visit_interactions DISABLE ROW LEVEL SECURITY;

-- Verify tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%clinical%';