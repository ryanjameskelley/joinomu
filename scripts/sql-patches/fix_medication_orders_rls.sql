-- Fix medication order RLS policy and medication tracking RLS policy
-- The issue is that admin_users table doesn't exist, it should be 'admins'

-- First, fix the medication tracking RLS policy (from October 4th migration)
DROP POLICY IF EXISTS "Admins can view all tracking entries" ON medication_tracking_entries;

CREATE POLICY "Admins can view all tracking entries" ON medication_tracking_entries
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM admins WHERE profile_id = auth.uid()
    )
  );

-- Verify the existing medication orders RLS policy is correct
-- It should already reference 'admins' table, but let's double-check and recreate if needed
DROP POLICY IF EXISTS "Admins can manage all medication orders" ON medication_orders;

CREATE POLICY "Admins can manage all medication orders" ON medication_orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE profile_id = auth.uid()
  )
);

-- Add some debug logging for troubleshooting
COMMENT ON POLICY "Admins can manage all medication orders" ON medication_orders IS 
'Updated policy to use correct admins table reference. Fixed on Oct 5, 2025';

COMMENT ON POLICY "Admins can view all tracking entries" ON medication_tracking_entries IS 
'Fixed policy to use correct admins table instead of admin_users. Fixed on Oct 5, 2025';