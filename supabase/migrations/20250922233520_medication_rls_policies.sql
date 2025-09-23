-- Row Level Security Policies for Medication Management System
-- Enable RLS on all medication tables and create appropriate policies

-- Enable RLS on all medication tables
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medication_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_orders ENABLE ROW LEVEL SECURITY;

-- MEDICATIONS TABLE POLICIES
-- Everyone can read active medications (for browsing catalog)
CREATE POLICY "Anyone can view active medications" ON medications
FOR SELECT USING (active = true);

-- Only admins can manage medications
CREATE POLICY "Admins can manage all medications" ON medications
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE profile_id = auth.uid()
  )
);

-- PATIENT MEDICATION PREFERENCES POLICIES
-- Patients can manage their own preferences
CREATE POLICY "Patients can manage own medication preferences" ON patient_medication_preferences
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE profile_id = auth.uid() AND id = patient_medication_preferences.patient_id
  )
);

-- Providers can view preferences for their assigned patients
CREATE POLICY "Providers can view assigned patient preferences" ON patient_medication_preferences
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patient_assignments pa
    JOIN providers p ON pa.provider_id = p.id
    WHERE p.profile_id = auth.uid() 
    AND pa.patient_id = patient_medication_preferences.patient_id
  )
);

-- Admins can view all preferences
CREATE POLICY "Admins can view all medication preferences" ON patient_medication_preferences
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE profile_id = auth.uid()
  )
);

-- MEDICATION APPROVALS POLICIES
-- Providers can manage approvals for their assigned patients
CREATE POLICY "Providers can manage approvals for assigned patients" ON medication_approvals
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM providers p
    JOIN patient_assignments pa ON p.id = pa.provider_id
    JOIN patient_medication_preferences pmp ON pa.patient_id = pmp.patient_id
    WHERE p.profile_id = auth.uid() 
    AND pmp.id = medication_approvals.preference_id
  )
);

-- Patients can view their own medication approvals
CREATE POLICY "Patients can view own medication approvals" ON medication_approvals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patients pt
    JOIN patient_medication_preferences pmp ON pt.id = pmp.patient_id
    WHERE pt.profile_id = auth.uid() 
    AND pmp.id = medication_approvals.preference_id
  )
);

-- Admins can view all approvals
CREATE POLICY "Admins can view all medication approvals" ON medication_approvals
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE profile_id = auth.uid()
  )
);

-- MEDICATION ORDERS POLICIES
-- Patients can view their own orders
CREATE POLICY "Patients can view own medication orders" ON medication_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patients 
    WHERE profile_id = auth.uid() AND id = medication_orders.patient_id
  )
);

-- Admins can manage all orders (payment, fulfillment, tracking)
CREATE POLICY "Admins can manage all medication orders" ON medication_orders
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM admins 
    WHERE profile_id = auth.uid()
  )
);

-- Providers can view orders for their assigned patients (read-only)
CREATE POLICY "Providers can view assigned patient orders" ON medication_orders
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM patient_assignments pa
    JOIN providers p ON pa.provider_id = p.id
    WHERE p.profile_id = auth.uid() 
    AND pa.patient_id = medication_orders.patient_id
  )
);

-- Create helper functions for medication workflows

-- Function to get patient medication status overview
CREATE OR REPLACE FUNCTION get_patient_medication_overview(patient_uuid UUID)
RETURNS TABLE (
  medication_name TEXT,
  category TEXT,
  preference_status TEXT,
  approval_status TEXT,
  order_status TEXT,
  payment_status TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.name,
    m.category,
    pmp.status as preference_status,
    COALESCE(ma.status, 'no_review') as approval_status,
    COALESCE(mo.fulfillment_status, 'no_order') as order_status,
    COALESCE(mo.payment_status, 'no_payment') as payment_status
  FROM patient_medication_preferences pmp
  JOIN medications m ON pmp.medication_id = m.id
  LEFT JOIN medication_approvals ma ON pmp.id = ma.preference_id
  LEFT JOIN medication_orders mo ON ma.id = mo.approval_id
  WHERE pmp.patient_id = patient_uuid
  ORDER BY pmp.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get provider medication approvals pending
CREATE OR REPLACE FUNCTION get_provider_pending_approvals(provider_uuid UUID)
RETURNS TABLE (
  preference_id UUID,
  patient_name TEXT,
  medication_name TEXT,
  preferred_dosage TEXT,
  frequency TEXT,
  patient_notes TEXT,
  requested_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    pmp.id,
    CONCAT(pr.first_name, ' ', pr.last_name),
    m.name,
    pmp.preferred_dosage,
    pmp.frequency,
    pmp.notes,
    pmp.requested_date
  FROM patient_medication_preferences pmp
  JOIN medications m ON pmp.medication_id = m.id
  JOIN patients pt ON pmp.patient_id = pt.id
  JOIN profiles pr ON pt.profile_id = pr.id
  JOIN patient_assignments pa ON pt.id = pa.patient_id
  JOIN providers prov ON pa.provider_id = prov.id
  LEFT JOIN medication_approvals ma ON pmp.id = ma.preference_id
  WHERE prov.profile_id = provider_uuid
  AND pmp.status = 'pending'
  AND ma.id IS NULL -- No approval exists yet
  ORDER BY pmp.requested_date ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get admin fulfillment queue
CREATE OR REPLACE FUNCTION get_admin_fulfillment_queue()
RETURNS TABLE (
  order_id UUID,
  patient_name TEXT,
  medication_name TEXT,
  quantity INTEGER,
  total_amount DECIMAL,
  payment_status TEXT,
  fulfillment_status TEXT,
  order_date TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mo.id,
    CONCAT(pr.first_name, ' ', pr.last_name),
    m.name,
    mo.quantity,
    mo.total_amount,
    mo.payment_status,
    mo.fulfillment_status,
    mo.created_at
  FROM medication_orders mo
  JOIN medications m ON mo.medication_id = m.id
  JOIN patients pt ON mo.patient_id = pt.id
  JOIN profiles pr ON pt.profile_id = pr.id
  WHERE mo.fulfillment_status IN ('pending', 'processing')
  ORDER BY 
    CASE mo.payment_status 
      WHEN 'paid' THEN 1 
      ELSE 2 
    END,
    mo.created_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;