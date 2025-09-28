-- ================================
-- JoinOmu Visit Addendums System
-- Database Schema for Visit Addendums
-- ================================

-- ================================
-- 1. Visit Addendums Table
-- ================================

-- Create table for visit addendums
CREATE TABLE visit_addendums (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  visit_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure content is not empty
  CONSTRAINT visit_addendums_content_not_empty CHECK (length(trim(content)) > 0)
);

-- ================================
-- 2. Indexes for Performance
-- ================================

CREATE INDEX idx_visit_addendums_visit_id ON visit_addendums(visit_id);
CREATE INDEX idx_visit_addendums_provider_id ON visit_addendums(provider_id);
CREATE INDEX idx_visit_addendums_created_at ON visit_addendums(created_at);

-- ================================
-- 3. Row Level Security (RLS)
-- ================================

-- Enable RLS on visit addendums table
ALTER TABLE visit_addendums ENABLE ROW LEVEL SECURITY;

-- Policy for providers: can view/create addendums for their patients
CREATE POLICY "Providers can manage addendums for their patients" 
ON visit_addendums
FOR ALL
TO authenticated
USING (
  provider_id IN (
    SELECT p.id FROM providers p 
    JOIN profiles pr ON p.profile_id = pr.id 
    WHERE pr.id = auth.uid()
  )
);

-- Policy for patients: can view addendums for their visits (read-only)
CREATE POLICY "Patients can view their visit addendums" 
ON visit_addendums
FOR SELECT
TO authenticated
USING (
  visit_id IN (
    SELECT a.id FROM appointments a 
    JOIN patients p ON a.patient_id = p.id
    JOIN profiles pr ON p.profile_id = pr.id 
    WHERE pr.id = auth.uid()
  )
);

-- Policy for admins: can view all addendums
CREATE POLICY "Admins can view all visit addendums" 
ON visit_addendums
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- ================================
-- 4. Comments for Documentation
-- ================================

COMMENT ON TABLE visit_addendums IS 'Addendums to previous visits for additional notes or corrections';
COMMENT ON COLUMN visit_addendums.visit_id IS 'Links addendum to specific appointment/visit';
COMMENT ON COLUMN visit_addendums.provider_id IS 'Provider who created the addendum';
COMMENT ON COLUMN visit_addendums.content IS 'Content of the addendum';
COMMENT ON COLUMN visit_addendums.created_at IS 'When the addendum was created';