-- Allow providers to update medication preferences for their assigned patients
-- Currently providers can only view preferences, but they need to update status, dosage, etc.

-- Add policy for providers to update preferences for their assigned patients
CREATE POLICY "Providers can update assigned patient preferences" ON patient_medication_preferences
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM patient_assignments pa
    JOIN providers p ON pa.provider_id = p.id
    WHERE p.profile_id = auth.uid() 
    AND pa.patient_id = patient_medication_preferences.patient_id
  )
);