-- Fix RLS policies for provider_schedules table

-- First, enable RLS on provider_schedules if it's not already enabled
ALTER TABLE provider_schedules ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies to avoid conflicts
DROP POLICY IF EXISTS patient_provider_schedules_policy ON provider_schedules;
DROP POLICY IF EXISTS provider_own_schedule_policy ON provider_schedules;
DROP POLICY IF EXISTS admin_full_access_provider_schedules ON provider_schedules;

-- Policy 1: Patients can view their providers' available slots
CREATE POLICY patient_provider_schedules_policy ON provider_schedules
FOR SELECT USING (
  provider_id IN (
    SELECT pa.provider_id FROM patient_assignments pa
    JOIN patients p ON pa.patient_id = p.id
    WHERE p.profile_id = auth.uid() AND pa.active = true
  )
);

-- Policy 2: Providers can manage their own schedule
CREATE POLICY provider_own_schedule_policy ON provider_schedules
FOR ALL USING (
  provider_id IN (
    SELECT pr.id FROM providers pr
    WHERE pr.profile_id = auth.uid()
  )
);

-- Policy 3: Admins can access all provider schedules
CREATE POLICY admin_full_access_provider_schedules ON provider_schedules
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);