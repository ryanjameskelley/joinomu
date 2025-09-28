-- Assign provider 7d1acf4a-4b7f-4014-b830-59aba55f5f60 to patient ca5ea49c-a142-4616-ae3d-5b3ce6c468ba for weight loss treatment

DO $$
DECLARE
    patient_record_id UUID;
    provider_record_id UUID;
BEGIN
    -- Get the patient record ID using profile_id
    SELECT id INTO patient_record_id FROM patients WHERE profile_id = 'ca5ea49c-a142-4616-ae3d-5b3ce6c468ba';
    
    -- Get the provider record ID using profile_id
    SELECT id INTO provider_record_id FROM providers WHERE profile_id = '7d1acf4a-4b7f-4014-b830-59aba55f5f60';
    
    -- Only insert if both records exist and this assignment doesn't already exist
    IF patient_record_id IS NOT NULL AND provider_record_id IS NOT NULL THEN
        -- Check if assignment already exists for this provider-patient combination
        IF NOT EXISTS (
            SELECT 1 FROM patient_assignments 
            WHERE patient_id = patient_record_id 
            AND provider_id = provider_record_id
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
            
            RAISE NOTICE 'Successfully assigned provider % to patient % for weight loss treatment', provider_record_id, patient_record_id;
        ELSE
            RAISE NOTICE 'Assignment already exists for this provider-patient combination';
        END IF;
    ELSE
        RAISE NOTICE 'Could not find patient or provider records. Patient: %, Provider: %', patient_record_id, provider_record_id;
    END IF;
END $$;