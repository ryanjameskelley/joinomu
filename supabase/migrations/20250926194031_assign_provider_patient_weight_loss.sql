-- Create additional provider assignment for weight loss treatment
-- This ensures Sarah Johnson has a specific weight loss provider assignment

DO $$
DECLARE
    patient_record_id UUID;
    provider_record_id UUID;
BEGIN
    -- Get first patient (Sarah Johnson should be first)
    SELECT id INTO patient_record_id FROM patients ORDER BY created_at LIMIT 1;
    
    -- Get first provider (Dr. Watson should be first)  
    SELECT id INTO provider_record_id FROM providers ORDER BY created_at LIMIT 1;
    
    -- Only insert if both records exist and this assignment doesn't already exist
    IF patient_record_id IS NOT NULL AND provider_record_id IS NOT NULL THEN
        -- Check if a weight loss assignment already exists for this patient
        IF NOT EXISTS (
            SELECT 1 FROM patient_assignments 
            WHERE patient_id = patient_record_id 
            AND treatment_type = 'weight_loss'
            AND is_primary = true
        ) THEN
            INSERT INTO patient_assignments (
              patient_id, 
              provider_id, 
              treatment_type, 
              is_primary, 
              assigned_date
            ) VALUES (
              patient_record_id,
              provider_record_id, 
              'weight_loss',
              true,
              CURRENT_DATE
            );
            
            RAISE NOTICE 'Successfully assigned provider % to patient % for weight loss', provider_record_id, patient_record_id;
        ELSE
            RAISE NOTICE 'Weight loss assignment already exists for this patient';
        END IF;
    ELSE
        RAISE NOTICE 'Could not find patient or provider records. Patient: %, Provider: %', patient_record_id, provider_record_id;
    END IF;
END $$;