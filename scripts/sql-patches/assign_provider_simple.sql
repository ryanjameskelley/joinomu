-- Assign provider b0fe1e12-3dce-4952-bfee-b374d85fd485 to patient 0e00dc93-9582-44b6-9803-f1ba893902eb

-- First, look up the provider and patient IDs
DO $$
DECLARE
    v_provider_id UUID;
    v_patient_id UUID;
BEGIN
    -- Find provider ID
    SELECT id INTO v_provider_id 
    FROM providers 
    WHERE user_id = 'b0fe1e12-3dce-4952-bfee-b374d85fd485';
    
    IF v_provider_id IS NULL THEN
        RAISE EXCEPTION 'Provider not found with user_id: b0fe1e12-3dce-4952-bfee-b374d85fd485';
    END IF;
    
    RAISE NOTICE 'Found provider ID: %', v_provider_id;
    
    -- Find patient ID
    SELECT id INTO v_patient_id 
    FROM patients 
    WHERE profile_id = '0e00dc93-9582-44b6-9803-f1ba893902eb';
    
    IF v_patient_id IS NULL THEN
        RAISE EXCEPTION 'Patient not found with profile_id: 0e00dc93-9582-44b6-9803-f1ba893902eb';
    END IF;
    
    RAISE NOTICE 'Found patient ID: %', v_patient_id;
    
    -- Check if assignment already exists
    IF EXISTS (
        SELECT 1 FROM patient_assignments 
        WHERE provider_id = v_provider_id 
        AND patient_id = v_patient_id 
        AND active = true
    ) THEN
        RAISE NOTICE 'Assignment already exists between provider % and patient %', v_provider_id, v_patient_id;
    ELSE
        -- Create the assignment
        INSERT INTO patient_assignments (
            provider_id,
            patient_id,
            treatment_type,
            is_primary,
            active,
            assigned_date
        ) VALUES (
            v_provider_id,
            v_patient_id,
            'weight_loss',
            true,
            true,
            NOW()
        );
        
        RAISE NOTICE 'Successfully created assignment between provider % and patient %', v_provider_id, v_patient_id;
    END IF;
END $$;