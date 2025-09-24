-- Fix RLS policy to allow providers to create medication orders for assigned patients
-- Currently providers can only view orders, but they need to create them when approving medications

-- Add policy for providers to create orders for their assigned patients
CREATE POLICY "Providers can create orders for assigned patients" ON medication_orders
FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM patient_assignments pa
    JOIN providers p ON pa.provider_id = p.id
    WHERE p.profile_id = auth.uid() 
    AND pa.patient_id = medication_orders.patient_id
  )
);

-- Also allow providers to update order status (for tracking updates)
CREATE POLICY "Providers can update assigned patient orders" ON medication_orders
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM patient_assignments pa
    JOIN providers p ON pa.provider_id = p.id
    WHERE p.profile_id = auth.uid() 
    AND pa.patient_id = medication_orders.patient_id
  )
);