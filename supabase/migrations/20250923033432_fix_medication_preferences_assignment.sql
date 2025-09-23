-- Fix medication preferences to only assign to actual patients
-- Clear existing preferences and create correct ones

-- Clear existing preferences
DELETE FROM patient_medication_preferences;

-- Add correct medication preferences only for patients (not admins/providers)
DO $$
DECLARE
    sarah_id UUID;
    michael_id UUID;
    jennifer_id UUID;
    david_id UUID;
    med_ids UUID[] := ARRAY(SELECT id FROM medications ORDER BY created_at);
BEGIN
    -- Get patient IDs by joining with profiles to filter by role
    SELECT p.id INTO sarah_id 
    FROM patients p 
    JOIN profiles prof ON p.profile_id = prof.id 
    WHERE prof.first_name = 'Sarah' AND prof.last_name = 'Johnson' 
    AND prof.role = 'patient';
    
    SELECT p.id INTO michael_id 
    FROM patients p 
    JOIN profiles prof ON p.profile_id = prof.id 
    WHERE prof.first_name = 'Michael' AND prof.last_name = 'Roberts' 
    AND prof.role = 'patient';
    
    SELECT p.id INTO jennifer_id 
    FROM patients p 
    JOIN profiles prof ON p.profile_id = prof.id 
    WHERE prof.first_name = 'Jennifer' AND prof.last_name = 'Martinez' 
    AND prof.role = 'patient';
    
    SELECT p.id INTO david_id 
    FROM patients p 
    JOIN profiles prof ON p.profile_id = prof.id 
    WHERE prof.first_name = 'David' AND prof.last_name = 'Anderson' 
    AND prof.role = 'patient';
    
    -- Only proceed if we have patient IDs and medications
    IF sarah_id IS NOT NULL AND michael_id IS NOT NULL AND jennifer_id IS NOT NULL 
       AND david_id IS NOT NULL AND array_length(med_ids, 1) >= 3 THEN
        
        -- Sarah Johnson - Semaglutide preference
        INSERT INTO patient_medication_preferences (
            patient_id, 
            medication_id, 
            preferred_dosage, 
            frequency, 
            notes, 
            status
        ) VALUES (
            sarah_id, 
            med_ids[1], 
            '0.5mg', 
            'weekly', 
            'Starting dose for weight management', 
            'pending'
        );
        
        -- Michael Roberts - Ozempic preference
        INSERT INTO patient_medication_preferences (
            patient_id, 
            medication_id, 
            preferred_dosage, 
            frequency, 
            notes, 
            status
        ) VALUES (
            michael_id, 
            med_ids[2], 
            '1.0mg', 
            'weekly', 
            'Higher dose for weight loss', 
            'approved'
        );
        
        -- Jennifer Martinez - Wegovy preference  
        INSERT INTO patient_medication_preferences (
            patient_id, 
            medication_id, 
            preferred_dosage, 
            frequency, 
            notes, 
            status
        ) VALUES (
            jennifer_id, 
            med_ids[3], 
            '2.4mg', 
            'weekly', 
            'Max dose for significant weight loss', 
            'approved'
        );
        
        -- David Anderson - Semaglutide preference
        INSERT INTO patient_medication_preferences (
            patient_id, 
            medication_id, 
            preferred_dosage, 
            frequency, 
            notes, 
            status
        ) VALUES (
            david_id, 
            med_ids[1], 
            '0.25mg', 
            'weekly', 
            'Starting with lowest dose', 
            'pending'
        );
        
        RAISE NOTICE 'Successfully created medication preferences for % patients', 4;
    ELSE
        RAISE NOTICE 'Skipping medication preferences - patient IDs: %, %, %, %; medications: %', 
                    sarah_id, michael_id, jennifer_id, david_id, array_length(med_ids, 1);
    END IF;
END $$;